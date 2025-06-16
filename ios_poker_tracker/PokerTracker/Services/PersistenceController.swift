import CoreData
import Foundation

struct PersistenceController {
    static let shared = PersistenceController()

    static var preview: PersistenceController = {
        let result = PersistenceController(inMemory: true)
        let viewContext = result.container.viewContext
        
        // 建立預覽數據
        let sampleSession = Session(context: viewContext)
        sampleSession.id = UUID().uuidString
        sampleSession.location = "Sample Casino"
        sampleSession.date = "2024-01-15"
        sampleSession.smallBlind = 1.0
        sampleSession.bigBlind = 2.0
        sampleSession.currency = "USD"
        sampleSession.effectiveStack = 200.0
        sampleSession.tableSize = 6
        sampleSession.tag = "Live"
        sampleSession.createdAt = Date()
        sampleSession.updatedAt = Date()
        
        let sampleHand = Hand(context: viewContext)
        sampleHand.id = UUID().uuidString
        sampleHand.sessionId = sampleSession.id
        sampleHand.position = "BTN"
        sampleHand.holeCards = "AhKs"
        sampleHand.board = "AsKhQd"
        sampleHand.details = "Raised preflop, bet flop"
        sampleHand.result = 50.0
        sampleHand.favorite = false
        sampleHand.date = "2024-01-15"
        sampleHand.createdAt = Date()
        sampleHand.updatedAt = Date()
        
        do {
            try viewContext.save()
        } catch {
            let nsError = error as NSError
            fatalError("Unresolved error \(nsError), \(nsError.userInfo)")
        }
        return result
    }()

    let container: NSPersistentContainer

    init(inMemory: Bool = false) {
        container = NSPersistentContainer(name: "PokerTracker")
        if inMemory {
            container.persistentStoreDescriptions.first!.url = URL(fileURLWithPath: "/dev/null")
        }
        
        container.loadPersistentStores(completionHandler: { (storeDescription, error) in
            if let error = error as NSError? {
                fatalError("Unresolved error \(error), \(error.userInfo)")
            }
        })
        container.viewContext.automaticallyMergesChangesFromParent = true
    }
}

// MARK: - Core Data Operations
extension PersistenceController {
    
    func save() {
        let context = container.viewContext
        
        if context.hasChanges {
            do {
                try context.save()
            } catch {
                let nsError = error as NSError
                fatalError("Unresolved error \(nsError), \(nsError.userInfo)")
            }
        }
    }
    
    func delete(_ object: NSManagedObject) {
        container.viewContext.delete(object)
        save()
    }
    
    func fetch<T: NSManagedObject>(_ request: NSFetchRequest<T>) -> [T] {
        do {
            return try container.viewContext.fetch(request)
        } catch {
            print("Error fetching data: \(error)")
            return []
        }
    }
} 