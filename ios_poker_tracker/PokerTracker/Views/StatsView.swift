import SwiftUI
import CoreData

struct StatsView: View {
    @Environment(\.managedObjectContext) private var viewContext
    @FetchRequest(
        sortDescriptors: [NSSortDescriptor(keyPath: \Hand.createdAt, ascending: false)],
        animation: .default)
    private var hands: FetchedResults<Hand>
    
    @FetchRequest(
        sortDescriptors: [NSSortDescriptor(keyPath: \Session.createdAt, ascending: false)],
        animation: .default)
    private var sessions: FetchedResults<Session>
    
    private var stats: StatsModel {
        calculateStats()
    }
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: AppTheme.Spacing.lg) {
                    // Header
                    VStack(spacing: AppTheme.Spacing.sm) {
                        Text("統計分析")
                            .font(AppTheme.Typography.largeTitle)
                            .foregroundColor(AppTheme.Colors.text)
                        
                        Text("總覽你的撲克表現")
                            .font(AppTheme.Typography.body)
                            .foregroundColor(AppTheme.Colors.secondaryText)
                    }
                    .padding(.top, AppTheme.Spacing.md)
                    
                    // Overall Stats
                    VStack(spacing: AppTheme.Spacing.md) {
                        Text("總體統計")
                            .font(AppTheme.Typography.headline)
                            .foregroundColor(AppTheme.Colors.text)
                            .frame(maxWidth: .infinity, alignment: .leading)
                        
                        LazyVGrid(columns: [
                            GridItem(.flexible()),
                            GridItem(.flexible())
                        ], spacing: AppTheme.Spacing.md) {
                            StatCard(
                                title: "總盈虧",
                                value: formatCurrency(stats.totalProfit),
                                color: stats.totalProfit >= 0 ? AppTheme.Colors.profit : AppTheme.Colors.loss,
                                icon: stats.totalProfit >= 0 ? "arrow.up.circle.fill" : "arrow.down.circle.fill"
                            )
                            
                            StatCard(
                                title: "總Session數",
                                value: "\(stats.totalSessions)",
                                color: AppTheme.Colors.primary,
                                icon: "calendar.circle.fill"
                            )
                            
                            StatCard(
                                title: "勝率",
                                value: String(format: "%.1f%%", stats.winRate),
                                color: AppTheme.Colors.accent,
                                icon: "percent.circle.fill"
                            )
                            
                            StatCard(
                                title: "平均每Session",
                                value: formatCurrency(stats.avgSession),
                                color: stats.avgSession >= 0 ? AppTheme.Colors.profit : AppTheme.Colors.loss,
                                icon: "chart.line.uptrend.xyaxis.circle.fill"
                            )
                        }
                    }
                    
                    // By Stakes
                    if !stats.byStakes.isEmpty {
                        VStack(spacing: AppTheme.Spacing.md) {
                            Text("按盲注統計")
                                .font(AppTheme.Typography.headline)
                                .foregroundColor(AppTheme.Colors.text)
                                .frame(maxWidth: .infinity, alignment: .leading)
                            
                            VStack(spacing: AppTheme.Spacing.sm) {
                                ForEach(Array(stats.byStakes.keys.sorted()), id: \.self) { stake in
                                    if let profit = stats.byStakes[stake] {
                                        StakeRowView(stake: stake, profit: profit)
                                    }
                                }
                            }
                            .cardStyle()
                        }
                    }
                    
                    // By Location
                    if !stats.byLocation.isEmpty {
                        VStack(spacing: AppTheme.Spacing.md) {
                            Text("按地點統計")
                                .font(AppTheme.Typography.headline)
                                .foregroundColor(AppTheme.Colors.text)
                                .frame(maxWidth: .infinity, alignment: .leading)
                            
                            VStack(spacing: AppTheme.Spacing.sm) {
                                ForEach(Array(stats.byLocation.keys.sorted()), id: \.self) { location in
                                    if let profit = stats.byLocation[location] {
                                        LocationRowView(location: location, profit: profit)
                                    }
                                }
                            }
                            .cardStyle()
                        }
                    }
                    
                    // Recent Performance
                    VStack(spacing: AppTheme.Spacing.md) {
                        Text("最近表現")
                            .font(AppTheme.Typography.headline)
                            .foregroundColor(AppTheme.Colors.text)
                            .frame(maxWidth: .infinity, alignment: .leading)
                        
                        RecentPerformanceView(hands: Array(hands.prefix(10)))
                    }
                }
                .padding(.horizontal, AppTheme.Spacing.lg)
                .padding(.bottom, AppTheme.Spacing.xl)
            }
            .background(AppTheme.Colors.background)
        }
    }
    
    private func calculateStats() -> StatsModel {
        let handsArray = Array(hands)
        let sessionsArray = Array(sessions)
        
        let totalProfit = handsArray.reduce(0) { $0 + $1.result }
        let totalSessions = sessionsArray.count
        let winningHands = handsArray.filter { $0.result > 0 }.count
        let totalHands = handsArray.count
        let winRate = totalHands > 0 ? Double(winningHands) / Double(totalHands) * 100 : 0
        let avgSession = totalSessions > 0 ? totalProfit / Double(totalSessions) : 0
        
        // By Stakes
        var byStakes: [String: Double] = [:]
        for session in sessionsArray {
            let stake = String(format: "%.0f/%.0f", session.smallBlind, session.bigBlind)
            let sessionHands = handsArray.filter { $0.sessionId == session.id }
            let sessionProfit = sessionHands.reduce(0) { $0 + $1.result }
            byStakes[stake, default: 0] += sessionProfit
        }
        
        // By Location
        var byLocation: [String: Double] = [:]
        for session in sessionsArray {
            let location = session.location ?? "Unknown"
            let sessionHands = handsArray.filter { $0.sessionId == session.id }
            let sessionProfit = sessionHands.reduce(0) { $0 + $1.result }
            byLocation[location, default: 0] += sessionProfit
        }
        
        return StatsModel(
            totalProfit: totalProfit,
            totalSessions: totalSessions,
            winRate: winRate,
            avgSession: avgSession,
            byStakes: byStakes,
            byLocation: byLocation
        )
    }
    
    private func formatCurrency(_ amount: Double) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = "USD"
        return formatter.string(from: NSNumber(value: amount)) ?? "$0.00"
    }
}

// MARK: - Stat Card
struct StatCard: View {
    let title: String
    let value: String
    let color: Color
    let icon: String
    
    var body: some View {
        VStack(spacing: AppTheme.Spacing.sm) {
            HStack {
                Image(systemName: icon)
                    .font(.title2)
                    .foregroundColor(color)
                Spacer()
            }
            
            VStack(alignment: .leading, spacing: AppTheme.Spacing.xs) {
                Text(value)
                    .font(AppTheme.Typography.title)
                    .foregroundColor(color)
                    .frame(maxWidth: .infinity, alignment: .leading)
                
                Text(title)
                    .font(AppTheme.Typography.caption)
                    .foregroundColor(AppTheme.Colors.secondaryText)
                    .frame(maxWidth: .infinity, alignment: .leading)
            }
        }
        .padding(AppTheme.Spacing.md)
        .cardStyle()
    }
}

// MARK: - Stake Row View
struct StakeRowView: View {
    let stake: String
    let profit: Double
    
    var body: some View {
        HStack {
            Text(stake)
                .font(AppTheme.Typography.body)
                .foregroundColor(AppTheme.Colors.text)
            
            Spacer()
            
            Text(profit >= 0 ? String(format: "+$%.2f", profit) : String(format: "-$%.2f", abs(profit)))
                .font(AppTheme.Typography.headline)
                .foregroundColor(profit >= 0 ? AppTheme.Colors.profit : AppTheme.Colors.loss)
        }
        .padding(.horizontal, AppTheme.Spacing.md)
        .padding(.vertical, AppTheme.Spacing.sm)
    }
}

// MARK: - Location Row View
struct LocationRowView: View {
    let location: String
    let profit: Double
    
    var body: some View {
        HStack {
            Text(location)
                .font(AppTheme.Typography.body)
                .foregroundColor(AppTheme.Colors.text)
            
            Spacer()
            
            Text(profit >= 0 ? String(format: "+$%.2f", profit) : String(format: "-$%.2f", abs(profit)))
                .font(AppTheme.Typography.headline)
                .foregroundColor(profit >= 0 ? AppTheme.Colors.profit : AppTheme.Colors.loss)
        }
        .padding(.horizontal, AppTheme.Spacing.md)
        .padding(.vertical, AppTheme.Spacing.sm)
    }
}

// MARK: - Recent Performance View
struct RecentPerformanceView: View {
    let hands: [Hand]
    
    var body: some View {
        VStack(spacing: AppTheme.Spacing.sm) {
            ForEach(hands, id: \.objectID) { hand in
                HStack {
                    HoleCardsDisplay(holeCardsString: hand.holeCards, size: .small)
                    
                    VStack(alignment: .leading, spacing: 2) {
                        Text(hand.details ?? "")
                            .font(AppTheme.Typography.caption)
                            .foregroundColor(AppTheme.Colors.text)
                            .lineLimit(1)
                        
                        if let date = hand.createdAt {
                            Text(DateFormatter.shortDate.string(from: date))
                                .font(AppTheme.Typography.small)
                                .foregroundColor(AppTheme.Colors.gray)
                        }
                    }
                    
                    Spacer()
                    
                    Text(hand.result >= 0 ? String(format: "+$%.2f", hand.result) : String(format: "-$%.2f", abs(hand.result)))
                        .font(AppTheme.Typography.caption)
                        .foregroundColor(hand.result >= 0 ? AppTheme.Colors.profit : AppTheme.Colors.loss)
                }
                .padding(.horizontal, AppTheme.Spacing.md)
                .padding(.vertical, AppTheme.Spacing.sm)
                
                if hand != hands.last {
                    Divider()
                }
            }
        }
        .cardStyle()
    }
}

// MARK: - Date Formatter Extension
extension DateFormatter {
    static let shortDate: DateFormatter = {
        let formatter = DateFormatter()
        formatter.dateStyle = .short
        return formatter
    }()
}

#Preview {
    StatsView()
        .environment(\.managedObjectContext, PersistenceController.preview.container.viewContext)
} 