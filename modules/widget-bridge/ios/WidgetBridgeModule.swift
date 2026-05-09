import ExpoModulesCore
import WidgetKit

private let APP_GROUP = "group.com.carloshuarcaya.goaltracker"
private let GOALS_KEY = "goals"

public class WidgetBridgeModule: Module {
  public func definition() -> ModuleDefinition {
    Name("WidgetBridge")

    Function("writeGoals") { (json: String) in
      guard let defaults = UserDefaults(suiteName: APP_GROUP) else { return }
      defaults.set(json, forKey: GOALS_KEY)
    }

    Function("reloadWidgets") {
      if #available(iOS 14.0, *) {
        WidgetCenter.shared.reloadAllTimelines()
      }
    }
  }
}
