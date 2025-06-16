import SwiftUI

struct SettingsView: View {
    @State private var showingSubscription = false
    
    var body: some View {
        NavigationView {
            List {
                // Header
                Section {
                    VStack(spacing: AppTheme.Spacing.md) {
                        Image(systemName: "suit.club.fill")
                            .font(.system(size: 60))
                            .foregroundColor(AppTheme.Colors.primary)
                        
                        Text("Poker Tracker")
                            .font(AppTheme.Typography.title)
                            .foregroundColor(AppTheme.Colors.text)
                        
                        Text("專業撲克手牌追蹤器")
                            .font(AppTheme.Typography.body)
                            .foregroundColor(AppTheme.Colors.secondaryText)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, AppTheme.Spacing.lg)
                }
                .listRowBackground(Color.clear)
                
                // Membership Section
                Section("會員資格") {
                    SettingsRow(
                        icon: "crown.fill",
                        title: "Premium 訂閱",
                        subtitle: "升級解鎖所有功能",
                        color: .orange
                    ) {
                        showingSubscription = true
                    }
                    
                    SettingsRow(
                        icon: "arrow.clockwise.circle.fill",
                        title: "恢復購買",
                        subtitle: nil,
                        color: AppTheme.Colors.primary
                    ) {
                        // Handle restore purchases
                        handleRestorePurchases()
                    }
                }
                
                // Pro Features Section
                Section("Pro 功能") {
                    SettingsRow(
                        icon: "chart.bar.fill",
                        title: "匯出到 Excel",
                        subtitle: "Pro Only",
                        color: .green
                    ) {
                        handleFeatureInDevelopment("匯出到 Excel")
                    }
                    
                    SettingsRow(
                        icon: "target",
                        title: "進階分析",
                        subtitle: "詳細統計報告",
                        color: .blue
                    ) {
                        handleFeatureInDevelopment("進階分析")
                    }
                    
                    SettingsRow(
                        icon: "photo.fill",
                        title: "自動儲存到相簿",
                        subtitle: "Pro Only",
                        color: .purple
                    ) {
                        handleFeatureInDevelopment("自動儲存到相簿")
                    }
                    
                    SettingsRow(
                        icon: "brain.head.profile.fill",
                        title: "AI 手牌分析",
                        subtitle: "無限制使用",
                        color: .red
                    ) {
                        handleFeatureInDevelopment("AI 手牌分析")
                    }
                }
                
                // Data Management Section
                Section("數據管理") {
                    SettingsRow(
                        icon: "icloud.and.arrow.up.fill",
                        title: "雲端同步",
                        subtitle: "備份到 iCloud",
                        color: .cyan
                    ) {
                        handleFeatureInDevelopment("雲端同步")
                    }
                    
                    SettingsRow(
                        icon: "square.and.arrow.up.fill",
                        title: "匯出數據",
                        subtitle: "JSON 格式",
                        color: .orange
                    ) {
                        handleExportData()
                    }
                    
                    SettingsRow(
                        icon: "square.and.arrow.down.fill",
                        title: "匯入數據",
                        subtitle: "從其他app匯入",
                        color: .green
                    ) {
                        handleImportData()
                    }
                }
                
                // Support Section
                Section("支援") {
                    SettingsRow(
                        icon: "hand.thumbsup.fill",
                        title: "評價我們",
                        subtitle: "在 App Store 留下評價",
                        color: .yellow
                    ) {
                        handleRateApp()
                    }
                    
                    SettingsRow(
                        icon: "message.fill",
                        title: "聯絡我們",
                        subtitle: "意見回饋與支援",
                        color: .blue
                    ) {
                        handleContactUs()
                    }
                    
                    SettingsRow(
                        icon: "questionmark.circle.fill",
                        title: "使用說明",
                        subtitle: "如何使用這個app",
                        color: .gray
                    ) {
                        handleShowHelp()
                    }
                }
                
                // App Info Section
                Section("應用程式資訊") {
                    HStack {
                        Text("版本")
                            .foregroundColor(AppTheme.Colors.text)
                        Spacer()
                        Text("1.0.0")
                            .foregroundColor(AppTheme.Colors.secondaryText)
                    }
                    
                    HStack {
                        Text("開發者")
                            .foregroundColor(AppTheme.Colors.text)
                        Spacer()
                        Text("Made with ❤️")
                            .foregroundColor(AppTheme.Colors.secondaryText)
                    }
                }
            }
            .navigationTitle("設定")
            .navigationBarTitleDisplayMode(.large)
        }
        .sheet(isPresented: $showingSubscription) {
            SubscriptionView()
        }
    }
    
    // MARK: - Action Handlers
    private func handleRestorePurchases() {
        // TODO: Implement restore purchases
        print("Restore purchases")
    }
    
    private func handleFeatureInDevelopment(_ feature: String) {
        // TODO: Show alert for features in development
        print("Feature in development: \(feature)")
    }
    
    private func handleExportData() {
        // TODO: Implement data export
        print("Export data")
    }
    
    private func handleImportData() {
        // TODO: Implement data import
        print("Import data")
    }
    
    private func handleRateApp() {
        // TODO: Open App Store rating
        print("Rate app")
    }
    
    private func handleContactUs() {
        // TODO: Open email or contact form
        print("Contact us")
    }
    
    private func handleShowHelp() {
        // TODO: Show help/tutorial
        print("Show help")
    }
}

// MARK: - Settings Row
struct SettingsRow: View {
    let icon: String
    let title: String
    let subtitle: String?
    let color: Color
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            HStack(spacing: AppTheme.Spacing.md) {
                Image(systemName: icon)
                    .font(.title2)
                    .foregroundColor(color)
                    .frame(width: 24, height: 24)
                
                VStack(alignment: .leading, spacing: 2) {
                    Text(title)
                        .font(AppTheme.Typography.body)
                        .foregroundColor(AppTheme.Colors.text)
                        .frame(maxWidth: .infinity, alignment: .leading)
                    
                    if let subtitle = subtitle {
                        Text(subtitle)
                            .font(AppTheme.Typography.caption)
                            .foregroundColor(AppTheme.Colors.secondaryText)
                            .frame(maxWidth: .infinity, alignment: .leading)
                    }
                }
                
                Spacer()
                
                Image(systemName: "chevron.right")
                    .font(.caption)
                    .foregroundColor(AppTheme.Colors.gray)
            }
            .padding(.vertical, 2)
        }
        .buttonStyle(PlainButtonStyle())
    }
}

// MARK: - Subscription View (Placeholder)
struct SubscriptionView: View {
    @Environment(\.dismiss) private var dismiss
    
    var body: some View {
        NavigationView {
            VStack(spacing: AppTheme.Spacing.xl) {
                Spacer()
                
                Image(systemName: "crown.fill")
                    .font(.system(size: 80))
                    .foregroundColor(.orange)
                
                Text("Poker Tracker Premium")
                    .font(AppTheme.Typography.largeTitle)
                    .foregroundColor(AppTheme.Colors.text)
                
                Text("解鎖所有進階功能")
                    .font(AppTheme.Typography.body)
                    .foregroundColor(AppTheme.Colors.secondaryText)
                
                VStack(alignment: .leading, spacing: AppTheme.Spacing.md) {
                    FeatureRow(icon: "chart.bar.fill", text: "無限制手牌記錄")
                    FeatureRow(icon: "brain.head.profile.fill", text: "AI 手牌分析")
                    FeatureRow(icon: "chart.line.uptrend.xyaxis", text: "進階統計報告")
                    FeatureRow(icon: "square.and.arrow.up.fill", text: "數據匯出功能")
                    FeatureRow(icon: "icloud.and.arrow.up.fill", text: "雲端同步")
                }
                .padding(.horizontal, AppTheme.Spacing.lg)
                
                Spacer()
                
                VStack(spacing: AppTheme.Spacing.md) {
                    Button("開始免費試用") {
                        // TODO: Handle subscription
                    }
                    .primaryButtonStyle()
                    
                    Button("恢復購買") {
                        // TODO: Handle restore
                    }
                    .secondaryButtonStyle()
                }
                .padding(.horizontal, AppTheme.Spacing.lg)
                .padding(.bottom, AppTheme.Spacing.xl)
            }
            .navigationTitle("Premium")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("關閉") {
                        dismiss()
                    }
                }
            }
        }
    }
}

// MARK: - Feature Row
struct FeatureRow: View {
    let icon: String
    let text: String
    
    var body: some View {
        HStack(spacing: AppTheme.Spacing.md) {
            Image(systemName: icon)
                .font(.title3)
                .foregroundColor(AppTheme.Colors.primary)
                .frame(width: 24)
            
            Text(text)
                .font(AppTheme.Typography.body)
                .foregroundColor(AppTheme.Colors.text)
            
            Spacer()
        }
    }
}

#Preview {
    SettingsView()
} 