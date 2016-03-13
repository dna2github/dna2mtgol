using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.IO;
using System.Drawing;
using System.Drawing.Imaging;

namespace DrawaliveWatermark
{
    class Program
    {
        static void Watermark(Bitmap input, Bitmap watermark, ImageAttributes attrs)
        {
            using (Graphics gr = Graphics.FromImage(input))
            {
                int x, y, w, h;
                x = (input.Width - watermark.Width) / 2;
                y = (input.Height - watermark.Height) / 2;
                if (x < 0)
                {
                    x = 0;
                    w = input.Width;
                }
                else
                    w = watermark.Width;
                if (y < 0)
                {
                    y = 0;
                    h = input.Height;
                }
                else
                    h = watermark.Height;
                Rectangle rect = new Rectangle(x, y, w, h);
                gr.DrawImage(watermark, rect,
                    0, 0, watermark.Width, watermark.Height,
                    GraphicsUnit.Pixel, attrs);
            }
        }

        static void Main(string[] args)
        {
            if (args.Length < 1) return;
            string path_app = Path.GetDirectoryName(Environment.GetCommandLineArgs()[0]);
            string path = args[0];
            if (!Directory.Exists(path)) return;
            string path_done = path + Path.DirectorySeparatorChar + "_watermark";
            if (!Directory.Exists(path_done)) Directory.CreateDirectory(path_done);

            ColorMatrix color_matrix = new ColorMatrix();
            color_matrix.Matrix33 = 0.3f; // watermark opacity
            ImageAttributes image_attributes = new ImageAttributes();
            image_attributes.SetColorMatrices(color_matrix, null);

            // add an image file to resource as watermark
            using (Bitmap watermark = DrawaliveWatermark.Properties.Resources.watermark)
            {
                foreach (string filename in Directory.GetFiles(path))
                {
                    string ext = Path.GetExtension(filename).ToLower();
                    if (".jpg".CompareTo(ext) != 0) continue;
                    Console.WriteLine(filename);
                    using (Bitmap bmp = (Bitmap)Bitmap.FromFile(filename))
                    {
                        Watermark(bmp, watermark, image_attributes);
                        bmp.Save(path_done +
                            Path.DirectorySeparatorChar +
                            Path.GetFileName(filename), ImageFormat.Jpeg);
                    }
                }
            }
        }
    }
}
