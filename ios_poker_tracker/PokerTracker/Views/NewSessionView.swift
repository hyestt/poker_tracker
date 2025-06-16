import SwiftUI
import CoreData

struct NewSessionView: View {
    @Environment(\.managedObjectContext) private var viewContext
    @Environment(\.dismiss) private var dismiss
    
    @State private var location = ""
    @State private var date = Date()
    @State private var smallBlind = ""
    @State private var bigBlind = ""
    @State private var currency = "USD"
    @State private var effectiveStack = ""
    @State private var tableSize = 6
    @State private var tag = ""
    
    private let currencies = ["USD", "EUR", "GBP", "JPY", "CNY", "TWD"]
    private let tableSizes = [2, 6, 9, 10]
    private let tags = ["Live", "Online", "Tournament", "Cash Game", "Home Game"]
    
    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("基本資訊")) {
                    // Location
                    HStack {
                        Text("地點")
                            .foregroundColor(AppTheme.Colors.text)
                        Spacer()
                        TextField("賭場或地點", text: $location)
                            .multilineTextAlignment(.trailing)
                            .foregroundColor(AppTheme.Colors.secondaryText)
                    }
                    
                    // Date
                    DatePicker("日期", selection: $date, displayedComponents: .date)
                        .foregroundColor(AppTheme.Colors.text)
                    
                    // Currency
                    HStack {
                        Text("貨幣")
                            .foregroundColor(AppTheme.Colors.text)
                        Spacer()
                        Picker("貨幣", selection: $currency) {
                            ForEach(currencies, id: \.self) { currency in
                                Text(currency).tag(currency)
                            }
                        }
                        .pickerStyle(MenuPickerStyle())
                    }
                }
                
                Section(header: Text("遊戲設定")) {
                    // Small Blind
                    HStack {
                        Text("小盲")
                            .foregroundColor(AppTheme.Colors.text)
                        Spacer()
                        TextField("1", text: $smallBlind)
                            .keyboardType(.decimalPad)
                            .multilineTextAlignment(.trailing)
                            .foregroundColor(AppTheme.Colors.secondaryText)
                    }
                    
                    // Big Blind
                    HStack {
                        Text("大盲")
                            .foregroundColor(AppTheme.Colors.text)
                        Spacer()
                        TextField("2", text: $bigBlind)
                            .keyboardType(.decimalPad)
                            .multilineTextAlignment(.trailing)
                            .foregroundColor(AppTheme.Colors.secondaryText)
                    }
                    
                    // Effective Stack
                    HStack {
                        Text("有效籌碼")
                            .foregroundColor(AppTheme.Colors.text)
                        Spacer()
                        TextField("200", text: $effectiveStack)
                            .keyboardType(.decimalPad)
                            .multilineTextAlignment(.trailing)
                            .foregroundColor(AppTheme.Colors.secondaryText)
                    }
                    
                    // Table Size
                    HStack {
                        Text("桌子人數")
                            .foregroundColor(AppTheme.Colors.text)
                        Spacer()
                        Picker("桌子人數", selection: $tableSize) {
                            ForEach(tableSizes, id: \.self) { size in
                                Text("\(size)人桌").tag(size)
                            }
                        }
                        .pickerStyle(MenuPickerStyle())
                    }
                }
                
                Section(header: Text("標籤")) {
                    // Tag Selection
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: AppTheme.Spacing.sm) {
                            ForEach(tags, id: \.self) { tagOption in
                                Button(action: {
                                    tag = tag == tagOption ? "" : tagOption
                                }) {
                                    Text(tagOption)
                                        .font(AppTheme.Typography.caption)
                                        .padding(.horizontal, AppTheme.Spacing.md)
                                        .padding(.vertical, AppTheme.Spacing.sm)
                                        .background(tag == tagOption ? AppTheme.Colors.primary : AppTheme.Colors.lightGray)
                                        .foregroundColor(tag == tagOption ? .white : AppTheme.Colors.text)
                                        .cornerRadius(AppTheme.CornerRadius.small)
                                }
                            }
                        }
                        .padding(.horizontal, AppTheme.Spacing.sm)
                    }
                    .listRowInsets(EdgeInsets())
                    
                    // Custom Tag
                    HStack {
                        Text("自定義標籤")
                            .foregroundColor(AppTheme.Colors.text)
                        Spacer()
                        TextField("輸入標籤", text: $tag)
                            .multilineTextAlignment(.trailing)
                            .foregroundColor(AppTheme.Colors.secondaryText)
                    }
                }
            }
            .navigationTitle("新建Session")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("取消") {
                        dismiss()
                    }
                }
                
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("開始記錄") {
                        saveSession()
                    }
                    .disabled(!isFormValid)
                }
            }
        }
    }
    
    private var isFormValid: Bool {
        !location.isEmpty &&
        !smallBlind.isEmpty &&
        !bigBlind.isEmpty &&
        !effectiveStack.isEmpty &&
        Double(smallBlind) != nil &&
        Double(bigBlind) != nil &&
        Double(effectiveStack) != nil
    }
    
    private func saveSession() {
        let newSession = Session(context: viewContext)
        newSession.id = UUID().uuidString
        newSession.location = location
        newSession.date = DateFormatter.sessionDate.string(from: date)
        newSession.smallBlind = Double(smallBlind) ?? 0
        newSession.bigBlind = Double(bigBlind) ?? 0
        newSession.currency = currency
        newSession.effectiveStack = Double(effectiveStack) ?? 0
        newSession.tableSize = Int16(tableSize)
        newSession.tag = tag
        newSession.createdAt = Date()
        newSession.updatedAt = Date()
        
        do {
            try viewContext.save()
            dismiss()
            // TODO: Navigate to RecordHandView with sessionId
        } catch {
            print("Error saving session: \(error)")
        }
    }
}

// MARK: - Date Formatter Extension
extension DateFormatter {
    static let sessionDate: DateFormatter = {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter
    }()
}

#Preview {
    NewSessionView()
        .environment(\.managedObjectContext, PersistenceController.preview.container.viewContext)
} 