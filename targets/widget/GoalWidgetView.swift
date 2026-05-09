import SwiftUI
import WidgetKit

struct GoalWidgetEntryView: View {
  var entry: GoalProvider.Entry
  @Environment(\.widgetFamily) var family

  var body: some View {
    switch family {
    case .systemSmall:
      SmallView(goal: entry.selectedGoal ?? entry.goals.first)
    case .systemMedium:
      MediumView(goals: Array(entry.goals.prefix(2)))
    case .systemLarge:
      LargeView(goals: Array(entry.goals.prefix(4)))
    default:
      EmptyView()
    }
  }
}

private struct SmallView: View {
  let goal: Goal?

  var body: some View {
    if let goal = goal {
      VStack(alignment: .leading, spacing: 0) {
        IconBadge(icon: goal.icon)
        Spacer(minLength: 0)
        VStack(alignment: .leading, spacing: 6) {
          Text(formatRange(progress: goal.progress, total: goal.total, unit: goal.unit))
            .font(.system(size: 15, weight: .semibold))
            .foregroundStyle(.primary)
            .lineLimit(1)
          Text(goal.name)
            .font(.system(size: 11, weight: .semibold))
            .foregroundStyle(.secondary)
            .lineLimit(1)
          ProgressBar(value: goal.progress / goal.total)
        }
      }
    } else {
      Text("No goals yet.")
        .font(.system(size: 14, weight: .semibold))
        .foregroundStyle(.secondary)
    }
  }
}

private struct MediumView: View {
  let goals: [Goal]
  var body: some View {
    if goals.isEmpty {
      Text("No goals yet.")
        .font(.system(size: 14, weight: .semibold))
        .foregroundStyle(.secondary)
    } else {
      VStack(spacing: 12) {
        ForEach(goals) { GoalRow(goal: $0) }
      }
    }
  }
}

private struct LargeView: View {
  let goals: [Goal]
  var body: some View {
    if goals.isEmpty {
      Text("No goals yet.")
        .font(.system(size: 14, weight: .semibold))
        .foregroundStyle(.secondary)
    } else {
      VStack(spacing: 16) {
        ForEach(goals) { GoalRow(goal: $0) }
      }
    }
  }
}

private struct GoalRow: View {
  let goal: Goal
  var body: some View {
    HStack(spacing: 12) {
      IconBadge(icon: goal.icon)
      VStack(alignment: .leading, spacing: 6) {
        Text(formatRange(progress: goal.progress, total: goal.total, unit: goal.unit))
          .font(.system(size: 15, weight: .semibold))
          .foregroundStyle(.primary)
          .lineLimit(1)
        Text(goal.name)
          .font(.system(size: 11, weight: .semibold))
          .foregroundStyle(.secondary)
          .lineLimit(1)
        ProgressBar(value: goal.progress / goal.total)
      }
    }
  }
}

private struct IconBadge: View {
  let icon: String
  var body: some View {
    Circle()
      .fill(Color(red: 0.886, green: 0.965, blue: 0.835))  // brand-mint
      .frame(width: 36, height: 36)
      .overlay(
        Image(systemName: sfSymbol(for: icon))
          .font(.system(size: 16, weight: .semibold))
          .foregroundStyle(Color(red: 0.087, green: 0.2, blue: 0))  // brand-greenDark
      )
  }
}

private struct ProgressBar: View {
  let value: Double  // 0..1
  var body: some View {
    GeometryReader { geo in
      ZStack(alignment: .leading) {
        Capsule()
          .fill(Color.primary.opacity(0.1))
        Capsule()
          .fill(Color(red: 0.624, green: 0.91, blue: 0.439))  // brand-green
          .frame(width: geo.size.width * min(1, max(0, value)))
      }
    }
    .frame(height: 4)
  }
}
