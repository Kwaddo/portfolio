import Foundation
import Vision
import CoreImage

let args = CommandLine.arguments
let input = URL(fileURLWithPath: args[1])
let output = URL(fileURLWithPath: args[2])
guard let ci = CIImage(contentsOf: input) else { fputs("cannot read input\n", stderr); exit(1) }
let req = VNGenerateForegroundInstanceMaskRequest()
let handler = VNImageRequestHandler(ciImage: ci, options: [:])
do {
  try handler.perform([req])
  guard let res = req.results?.first else { fputs("no foreground found\n", stderr); exit(2) }
  let pb = try res.generateScaledMaskForImage(forInstances: res.allInstances, from: handler)
  let mask = CIImage(cvPixelBuffer: pb)
  let ctx = CIContext()
  try ctx.writePNGRepresentation(of: mask, to: output, format: .RGBA8, colorSpace: CGColorSpaceCreateDeviceRGB())
  print("ok \(mask.extent)")
} catch { fputs("error: \(error)\n", stderr); exit(3) }
