// Lists on-screen windows (id, owner, title, size) so `screencapture -l <id>` can grab ONE window.
// Build: swiftc -O winid.swift -o winid    Run: ./winid [owner-name-substring]
import Foundation
import CoreGraphics
let filter = CommandLine.arguments.dropFirst().first?.lowercased()
let opts: CGWindowListOption = [.optionOnScreenOnly, .excludeDesktopElements]
guard let list = CGWindowListCopyWindowInfo(opts, kCGNullWindowID) as? [[String: Any]] else { exit(1) }
for w in list {
  let owner = (w[kCGWindowOwnerName as String] as? String) ?? ""
  let title = (w[kCGWindowName as String] as? String) ?? ""
  let id = (w[kCGWindowNumber as String] as? Int) ?? 0
  let layer = (w[kCGWindowLayer as String] as? Int) ?? 0
  let b = (w[kCGWindowBounds as String] as? [String: Any]) ?? [:]
  let wd = (b["Width"] as? Double) ?? 0, ht = (b["Height"] as? Double) ?? 0
  if layer != 0 || wd < 200 || ht < 150 { continue }
  if let f = filter, !owner.lowercased().contains(f), !title.lowercased().contains(f) { continue }
  print("\(id)\t\(owner)\t\(Int(wd))x\(Int(ht))\t\(title)")
}
