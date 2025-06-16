import Foundation
import CoreData

// MARK: - Session Model
struct SessionModel: Identifiable, Codable {
    let id: String
    var location: String
    var date: String
    var smallBlind: Double
    var bigBlind: Double
    var currency: String
    var effectiveStack: Double
    var tableSize: Int
    var tag: String
    var createdAt: Date?
    var updatedAt: Date?
    
    init(id: String = UUID().uuidString,
         location: String = "",
         date: String = "",
         smallBlind: Double = 0,
         bigBlind: Double = 0,
         currency: String = "USD",
         effectiveStack: Double = 0,
         tableSize: Int = 6,
         tag: String = "",
         createdAt: Date? = Date(),
         updatedAt: Date? = Date()) {
        self.id = id
        self.location = location
        self.date = date
        self.smallBlind = smallBlind
        self.bigBlind = bigBlind
        self.currency = currency
        self.effectiveStack = effectiveStack
        self.tableSize = tableSize
        self.tag = tag
        self.createdAt = createdAt
        self.updatedAt = updatedAt
    }
}

// MARK: - Villain Model
struct VillainModel: Identifiable, Codable {
    let id: String
    var holeCards: String?
    var position: String?
    
    init(id: String = UUID().uuidString,
         holeCards: String? = nil,
         position: String? = nil) {
        self.id = id
        self.holeCards = holeCards
        self.position = position
    }
}

// MARK: - Hand Model
struct HandModel: Identifiable, Codable {
    let id: String
    var sessionId: String
    var position: String?
    var holeCards: String?
    var board: String?
    var details: String
    var note: String?
    var result: Double
    var analysis: String?
    var analysisDate: String?
    var favorite: Bool
    var tag: String?
    var villains: [VillainModel]?
    var date: String?
    var createdAt: Date?
    var updatedAt: Date?
    
    init(id: String = UUID().uuidString,
         sessionId: String,
         position: String? = nil,
         holeCards: String? = nil,
         board: String? = nil,
         details: String = "",
         note: String? = nil,
         result: Double = 0,
         analysis: String? = nil,
         analysisDate: String? = nil,
         favorite: Bool = false,
         tag: String? = nil,
         villains: [VillainModel]? = nil,
         date: String? = nil,
         createdAt: Date? = Date(),
         updatedAt: Date? = Date()) {
        self.id = id
        self.sessionId = sessionId
        self.position = position
        self.holeCards = holeCards
        self.board = board
        self.details = details
        self.note = note
        self.result = result
        self.analysis = analysis
        self.analysisDate = analysisDate
        self.favorite = favorite
        self.tag = tag
        self.villains = villains
        self.date = date
        self.createdAt = createdAt
        self.updatedAt = updatedAt
    }
}

// MARK: - Stats Model
struct StatsModel: Codable {
    var totalProfit: Double
    var totalSessions: Int
    var winRate: Double
    var avgSession: Double
    var byStakes: [String: Double]
    var byLocation: [String: Double]
    
    init(totalProfit: Double = 0,
         totalSessions: Int = 0,
         winRate: Double = 0,
         avgSession: Double = 0,
         byStakes: [String: Double] = [:],
         byLocation: [String: Double] = [:]) {
        self.totalProfit = totalProfit
        self.totalSessions = totalSessions
        self.winRate = winRate
        self.avgSession = avgSession
        self.byStakes = byStakes
        self.byLocation = byLocation
    }
}

// MARK: - Poker Card Models
enum Suit: String, CaseIterable, Codable {
    case hearts = "♥️"
    case diamonds = "♦️"
    case clubs = "♣️"
    case spades = "♠️"
    
    var color: String {
        switch self {
        case .hearts, .diamonds:
            return "red"
        case .clubs, .spades:
            return "black"
        }
    }
}

enum Rank: String, CaseIterable, Codable {
    case two = "2"
    case three = "3"
    case four = "4"
    case five = "5"
    case six = "6"
    case seven = "7"
    case eight = "8"
    case nine = "9"
    case ten = "T"
    case jack = "J"
    case queen = "Q"
    case king = "K"
    case ace = "A"
    
    var value: Int {
        switch self {
        case .two: return 2
        case .three: return 3
        case .four: return 4
        case .five: return 5
        case .six: return 6
        case .seven: return 7
        case .eight: return 8
        case .nine: return 9
        case .ten: return 10
        case .jack: return 11
        case .queen: return 12
        case .king: return 13
        case .ace: return 14
        }
    }
}

struct PokerCard: Identifiable, Codable, Equatable {
    let id = UUID()
    let rank: Rank
    let suit: Suit
    
    var displayString: String {
        return "\(rank.rawValue)\(suit.rawValue)"
    }
    
    var shortString: String {
        return "\(rank.rawValue)\(suit.rawValue.first ?? "?")"
    }
} 