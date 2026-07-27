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
      LargeView(goals: Array(entry.goals.prefix(5)))
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
          Text(formatRange(goal: goal))
            .font(.system(size: 15, weight: .semibold))
            .foregroundStyle(.primary)
            .lineLimit(1)
          Text(goal.name)
            .font(.system(size: 11, weight: .semibold))
            .foregroundStyle(.secondary)
            .lineLimit(1)
          ProgressBar(value: goal.progressFraction)
        }
      }
    } else {
      Text("No goals yet.")
        .font(.system(size: 14, weight: .semibold))
        .foregroundStyle(.secondary)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
    }
  }
}

private struct WidgetHeader: View {
  var body: some View {
    Text("Goals")
      .font(.system(size: 14, weight: .bold))
      .foregroundStyle(.primary)
      .frame(maxWidth: .infinity, alignment: .leading)
  }
}

private struct MediumView: View {
  let goals: [Goal]
  var body: some View {
    if goals.isEmpty {
      Text("No goals yet.")
        .font(.system(size: 14, weight: .semibold))
        .foregroundStyle(.secondary)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
    } else {
      VStack(alignment: .leading, spacing: 10) {
        WidgetHeader()
        ForEach(goals) { GoalRow(goal: $0, compact: false) }
      }
      .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
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
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
    } else {
      VStack(alignment: .leading, spacing: 8) {
        WidgetHeader()
        ForEach(goals) { GoalRow(goal: $0, compact: true) }
      }
      .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
    }
  }
}

private struct GoalRow: View {
  let goal: Goal
  let compact: Bool

  var body: some View {
    HStack(spacing: compact ? 10 : 12) {
      IconBadge(icon: goal.icon, size: compact ? 30 : 36)
      VStack(alignment: .leading, spacing: compact ? 3 : 6) {
        Text(formatRange(goal: goal))
          .font(.system(size: compact ? 13 : 15, weight: .semibold))
          .foregroundStyle(.primary)
          .lineLimit(1)
        Text(goal.name)
          .font(.system(size: compact ? 10 : 11, weight: .semibold))
          .foregroundStyle(.secondary)
          .lineLimit(1)
        ProgressBar(value: goal.progressFraction)
      }
    }
  }
}

private struct IconBadge: View {
  let icon: String
  var size: CGFloat = 36
  var body: some View {
    Circle()
      .fill(Color(red: 0.624, green: 0.91, blue: 0.439))  // brand-green
      .frame(width: size, height: size)
      .overlay(
        Image(systemName: sfSymbol(for: icon))
          .font(.system(size: size * 0.5, weight: .heavy))
          .foregroundStyle(Color.black)
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
