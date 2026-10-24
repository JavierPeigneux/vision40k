import Foundation
import PDFKit
import AppKit
let pdf = PDFDocument(url: URL(fileURLWithPath: CommandLine.arguments[1]))!
if CommandLine.arguments.count == 2 {
 for i in 0..<pdf.pageCount {
  print("\n=== PDF PAGE \(i+1) ===\n" + (pdf.page(at:i)!.string ?? ""))
 }
} else {
 let number = Int(CommandLine.arguments[2])!
 let page = pdf.page(at:number-1)!
 let bounds = page.bounds(for:.mediaBox)
 let scale:CGFloat = 2
 let width=Int(bounds.width*scale),height=Int(bounds.height*scale)
 let bitmap=NSBitmapImageRep(bitmapDataPlanes:nil,pixelsWide:width,pixelsHigh:height,bitsPerSample:8,samplesPerPixel:4,hasAlpha:true,isPlanar:false,colorSpaceName:.deviceRGB,bytesPerRow:0,bitsPerPixel:0)!
 let context=NSGraphicsContext(bitmapImageRep:bitmap)!.cgContext
 context.setFillColor(NSColor.white.cgColor);context.fill(CGRect(x:0,y:0,width:width,height:height))
 context.scaleBy(x:scale,y:scale)
 page.draw(with:.mediaBox,to:context)
 try bitmap.representation(using:.png,properties:[:])!.write(to:URL(fileURLWithPath:CommandLine.arguments[3]))
}
