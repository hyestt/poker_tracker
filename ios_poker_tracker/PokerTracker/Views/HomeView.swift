import SwiftUI
import CoreData

struct HomeView: View {
    @Environment(\.managedObjectContext) private var viewContext
    @FetchRequest(
        sortDescriptors: [NSSortDescriptor(keyPath: \Hand.createdAt, ascending: false)],
        animation: .default)
    private var hands: FetchedResults<Hand>
    
    @FetchRequest(
        sortDescriptors: [NSSortDescriptor(keyPath: \Session.createdAt, ascending: false)],
        animation: .default)
    private var sessions: FetchedResults<Session>
    
    @State private var showingNewSession = false
    @State private var showingFilters = false
    @State private var selectedFilter = "All Hands"
    @State private var searchText = ""
    
    private let filterOptions = ["All Hands", "Winning Hands", "Losing Hands", "Favorites"]
    
    var filteredHands: [Hand] {
        var result = Array(hands)
        
        // Apply filter
        switch selectedFilter {
        case "Winning Hands":
            result = result.filter { $0.result > 0 }
        case "Losing Hands":
            result = result.filter { $0.result < 0 }
        case "Favorites":
            result = result.filter { $0.favorite }
        default:
            break
        }
        
        // Apply search
        if !searchText.isEmpty {
            result = result.filter { hand in
                hand.details?.localizedCaseInsensitiveContains(searchText) == true ||
                hand.note?.localizedCaseInsensitiveContains(searchText) == true ||
                hand.position?.localizedCaseInsensitiveContains(searchText) == true
            }
        }
        
        return result
    }
    
    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // Header with Settings
                HStack {
                    Text("Poker Tracker")
                        .font(AppTheme.Typography.largeTitle)
                        .foregroundColor(AppTheme.Colors.text)
                    
                    Spacer()
                    
                    Button(action: {
                        // Settings action
                    }) {
                        Image(systemName: "gearshape.fill")
                            .font(.title2)
                            .foregroundColor(AppTheme.Colors.gray)
                    }
                }
                .padding(.horizontal, AppTheme.Spacing.lg)
                .padding(.top, AppTheme.Spacing.md)
                
                // Search and Filter
                VStack(spacing: AppTheme.Spacing.sm) {
                    // Search Bar
                    HStack {
                        Image(systemName: "magnifyingglass")
                            .foregroundColor(AppTheme.Colors.gray)
                        
                        TextField("搜尋手牌...", text: $searchText)
                            .textFieldStyle(PlainTextFieldStyle())
                    }
                    .padding(.horizontal, AppTheme.Spacing.md)
                    .padding(.vertical, AppTheme.Spacing.sm)
                    .background(AppTheme.Colors.inputBackground)
                    .cornerRadius(AppTheme.CornerRadius.small)
                    
                    // Filter Options
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: AppTheme.Spacing.sm) {
                            ForEach(filterOptions, id: \.self) { option in
                                Button(action: {
                                    selectedFilter = option
                                }) {
                                    Text(option)
                                        .font(AppTheme.Typography.caption)
                                        .padding(.horizontal, AppTheme.Spacing.md)
                                        .padding(.vertical, AppTheme.Spacing.sm)
                                        .background(selectedFilter == option ? AppTheme.Colors.primary : AppTheme.Colors.lightGray)
                                        .foregroundColor(selectedFilter == option ? .white : AppTheme.Colors.text)
                                        .cornerRadius(AppTheme.CornerRadius.small)
                                }
                            }
                        }
                        .padding(.horizontal, AppTheme.Spacing.lg)
                    }
                }
                .padding(.horizontal, AppTheme.Spacing.lg)
                .padding(.vertical, AppTheme.Spacing.md)
                
                // Hands List
                if filteredHands.isEmpty {
                    Spacer()
                    VStack(spacing: AppTheme.Spacing.md) {
                        Image(systemName: "suit.club.fill")
                            .font(.system(size: 60))
                            .foregroundColor(AppTheme.Colors.gray)
                        
                        Text("還沒有手牌記錄")
                            .font(AppTheme.Typography.headline)
                            .foregroundColor(AppTheme.Colors.secondaryText)
                        
                        Text("點擊下方的 + 按鈕開始記錄")
                            .font(AppTheme.Typography.body)
                            .foregroundColor(AppTheme.Colors.gray)
                    }
                    Spacer()
                } else {
                    List {
                        ForEach(filteredHands, id: \.objectID) { hand in
                            HandRowView(hand: hand)
                                .listRowInsets(EdgeInsets(top: AppTheme.Spacing.sm, leading: AppTheme.Spacing.lg, bottom: AppTheme.Spacing.sm, trailing: AppTheme.Spacing.lg))
                                .listRowSeparator(.hidden)
                        }
                        .onDelete(perform: deleteHands)
                    }
                    .listStyle(PlainListStyle())
                }
            }
            .background(AppTheme.Colors.background)
            .overlay(
                // Floating Action Button
                VStack {
                    Spacer()
                    HStack {
                        Spacer()
                        Button(action: {
                            showingNewSession = true
                        }) {
                            Image(systemName: "plus")
                                .font(.title2)
                                .foregroundColor(.white)
                                .frame(width: 56, height: 56)
                                .background(AppTheme.Colors.primary)
                                .clipShape(Circle())
                                .shadow(color: AppTheme.Shadow.button, radius: 4, x: 0, y: 2)
                        }
                        .padding(.trailing, AppTheme.Spacing.lg)
                        .padding(.bottom, AppTheme.Spacing.xl)
                    }
                }
            )
        }
        .sheet(isPresented: $showingNewSession) {
            NewSessionView()
        }
    }
    
    private func deleteHands(offsets: IndexSet) {
        withAnimation {
            offsets.map { filteredHands[$0] }.forEach(viewContext.delete)
            
            do {
                try viewContext.save()
            } catch {
                print("Error deleting hands: \(error)")
            }
        }
    }
}

// MARK: - Hand Row View
struct HandRowView: View {
    let hand: Hand
    
    private var timeAgo: String {
        guard let createdAt = hand.createdAt else { return "" }
        let formatter = RelativeDateTimeFormatter()
        formatter.unitsStyle = .abbreviated
        return formatter.localizedString(for: createdAt, relativeTo: Date())
    }
    
    private var resultColor: Color {
        hand.result >= 0 ? AppTheme.Colors.profit : AppTheme.Colors.loss
    }
    
    var body: some View {
        HStack(spacing: AppTheme.Spacing.md) {
            // Hole Cards
            HoleCardsDisplay(holeCardsString: hand.holeCards, size: .small)
            
            // Hand Details
            VStack(alignment: .leading, spacing: AppTheme.Spacing.xs) {
                HStack {
                    if let position = hand.position, !position.isEmpty {
                        Text(position)
                            .font(AppTheme.Typography.caption)
                            .padding(.horizontal, AppTheme.Spacing.sm)
                            .padding(.vertical, 2)
                            .background(AppTheme.Colors.accent)
                            .foregroundColor(.white)
                            .cornerRadius(4)
                    }
                    
                    if hand.favorite {
                        Image(systemName: "heart.fill")
                            .font(.caption)
                            .foregroundColor(.red)
                    }
                    
                    Spacer()
                }
                
                Text(hand.details ?? "")
                    .font(AppTheme.Typography.body)
                    .foregroundColor(AppTheme.Colors.text)
                    .lineLimit(2)
                
                if let board = hand.board, !board.isEmpty {
                    Text("Board: \(board)")
                        .font(AppTheme.Typography.caption)
                        .foregroundColor(AppTheme.Colors.secondaryText)
                }
            }
            
            Spacer()
            
            // Result and Time
            VStack(alignment: .trailing, spacing: AppTheme.Spacing.xs) {
                Text(hand.result >= 0 ? String(format: "+$%.2f", hand.result) : String(format: "-$%.2f", abs(hand.result)))
                    .font(AppTheme.Typography.headline)
                    .foregroundColor(resultColor)
                
                Text(timeAgo)
                    .font(AppTheme.Typography.small)
                    .foregroundColor(AppTheme.Colors.gray)
            }
        }
        .padding(AppTheme.Spacing.md)
        .cardStyle()
    }
}

#Preview {
    HomeView()
        .environment(\.managedObjectContext, PersistenceController.preview.container.viewContext)
} 