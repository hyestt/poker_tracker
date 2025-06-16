import SwiftUI

struct AppTheme {
    
    // MARK: - Colors
    struct Colors {
        static let primary = Color.blue
        static let background = Color(.systemGroupedBackground)
        static let card = Color(.systemBackground)
        static let text = Color(.label)
        static let secondaryText = Color(.secondaryLabel)
        static let border = Color(.separator)
        static let profit = Color.green
        static let loss = Color.red
        static let gray = Color(.systemGray)
        static let lightGray = Color(.systemGray5)
        static let inputBackground = Color(.systemGray6)
        static let inputFocus = Color.blue
        static let accent = Color.orange
    }
    
    // MARK: - Typography
    struct Typography {
        static let largeTitle = Font.largeTitle.weight(.bold)
        static let title = Font.title2.weight(.semibold)
        static let headline = Font.headline.weight(.medium)
        static let body = Font.body
        static let caption = Font.caption
        static let small = Font.caption2
    }
    
    // MARK: - Spacing
    struct Spacing {
        static let xs: CGFloat = 4
        static let sm: CGFloat = 8
        static let md: CGFloat = 16
        static let lg: CGFloat = 24
        static let xl: CGFloat = 32
        static let xxl: CGFloat = 48
    }
    
    // MARK: - Corner Radius
    struct CornerRadius {
        static let small: CGFloat = 8
        static let medium: CGFloat = 12
        static let large: CGFloat = 16
        static let card: CGFloat = 16
        static let button: CGFloat = 12
    }
    
    // MARK: - Shadows
    struct Shadow {
        static let card = Color.black.opacity(0.1)
        static let button = Color.black.opacity(0.2)
    }
}

// MARK: - View Extensions
extension View {
    func cardStyle() -> some View {
        self
            .background(AppTheme.Colors.card)
            .cornerRadius(AppTheme.CornerRadius.card)
            .shadow(color: AppTheme.Shadow.card, radius: 2, x: 0, y: 1)
    }
    
    func primaryButtonStyle() -> some View {
        self
            .foregroundColor(.white)
            .padding(.horizontal, AppTheme.Spacing.lg)
            .padding(.vertical, AppTheme.Spacing.md)
            .background(AppTheme.Colors.primary)
            .cornerRadius(AppTheme.CornerRadius.button)
    }
    
    func secondaryButtonStyle() -> some View {
        self
            .foregroundColor(AppTheme.Colors.primary)
            .padding(.horizontal, AppTheme.Spacing.lg)
            .padding(.vertical, AppTheme.Spacing.md)
            .background(AppTheme.Colors.lightGray)
            .cornerRadius(AppTheme.CornerRadius.button)
    }
} 