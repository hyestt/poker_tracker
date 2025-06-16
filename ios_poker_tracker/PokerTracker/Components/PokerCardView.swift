import SwiftUI

struct PokerCardView: View {
    let card: PokerCard?
    let size: CardSize
    let isSelected: Bool
    let onTap: (() -> Void)?
    
    enum CardSize {
        case small, medium, large
        
        var dimensions: CGSize {
            switch self {
            case .small:
                return CGSize(width: 30, height: 42)
            case .medium:
                return CGSize(width: 40, height: 56)
            case .large:
                return CGSize(width: 50, height: 70)
            }
        }
        
        var fontSize: CGFloat {
            switch self {
            case .small:
                return 10
            case .medium:
                return 12
            case .large:
                return 14
            }
        }
    }
    
    init(card: PokerCard?, size: CardSize = .medium, isSelected: Bool = false, onTap: (() -> Void)? = nil) {
        self.card = card
        self.size = size
        self.isSelected = isSelected
        self.onTap = onTap
    }
    
    var body: some View {
        Button(action: {
            onTap?()
        }) {
            ZStack {
                RoundedRectangle(cornerRadius: 6)
                    .fill(card != nil ? Color.white : AppTheme.Colors.lightGray)
                    .frame(width: size.dimensions.width, height: size.dimensions.height)
                    .overlay(
                        RoundedRectangle(cornerRadius: 6)
                            .stroke(isSelected ? AppTheme.Colors.primary : AppTheme.Colors.border, lineWidth: isSelected ? 2 : 1)
                    )
                
                if let card = card {
                    VStack(spacing: 2) {
                        Text(card.rank.rawValue)
                            .font(.system(size: size.fontSize, weight: .bold))
                            .foregroundColor(card.suit.color == "red" ? .red : .black)
                        
                        Text(card.suit.rawValue)
                            .font(.system(size: size.fontSize - 2))
                    }
                } else {
                    Text("?")
                        .font(.system(size: size.fontSize, weight: .bold))
                        .foregroundColor(AppTheme.Colors.gray)
                }
            }
        }
        .buttonStyle(PlainButtonStyle())
        .disabled(onTap == nil)
    }
}

// MARK: - Poker Cards Display
struct PokerCardsDisplay: View {
    let cards: [PokerCard]
    let size: PokerCardView.CardSize
    let spacing: CGFloat
    
    init(cards: [PokerCard], size: PokerCardView.CardSize = .medium, spacing: CGFloat = 4) {
        self.cards = cards
        self.size = size
        self.spacing = spacing
    }
    
    var body: some View {
        HStack(spacing: spacing) {
            ForEach(cards) { card in
                PokerCardView(card: card, size: size)
            }
        }
    }
}

// MARK: - Hole Cards Display
struct HoleCardsDisplay: View {
    let holeCardsString: String?
    let size: PokerCardView.CardSize
    
    init(holeCardsString: String?, size: PokerCardView.CardSize = .medium) {
        self.holeCardsString = holeCardsString
        self.size = size
    }
    
    var body: some View {
        HStack(spacing: 4) {
            if let holeCardsString = holeCardsString, !holeCardsString.isEmpty {
                let cards = parseHoleCards(holeCardsString)
                ForEach(cards, id: \.displayString) { card in
                    PokerCardView(card: card, size: size)
                }
            } else {
                PokerCardView(card: nil, size: size)
                PokerCardView(card: nil, size: size)
            }
        }
    }
    
    private func parseHoleCards(_ cardsString: String) -> [PokerCard] {
        let components = cardsString.components(separatedBy: " ")
        return components.compactMap { cardString in
            guard cardString.count >= 2 else { return nil }
            
            let rankString = String(cardString.prefix(1))
            let suitString = String(cardString.suffix(1))
            
            guard let rank = Rank(rawValue: rankString),
                  let suit = parseSuit(suitString) else { return nil }
            
            return PokerCard(rank: rank, suit: suit)
        }
    }
    
    private func parseSuit(_ suitString: String) -> Suit? {
        switch suitString.lowercased() {
        case "h":
            return .hearts
        case "d":
            return .diamonds
        case "c":
            return .clubs
        case "s":
            return .spades
        default:
            return nil
        }
    }
}

#Preview {
    VStack(spacing: 20) {
        HoleCardsDisplay(holeCardsString: "AhKs")
        HoleCardsDisplay(holeCardsString: "QdJc", size: .large)
        HoleCardsDisplay(holeCardsString: nil)
    }
    .padding()
} 