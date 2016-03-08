import java.awt.AlphaComposite;
import java.awt.Composite;
import java.awt.Graphics2D;
import java.awt.image.BufferedImage;
import java.io.File;

import javax.imageio.ImageIO;

public class ImageUtils {

    private static BufferedImage img;
    private static Graphics2D paper;

    private static void imageThumbnail(String input, int width, int height) throws Exception {
        BufferedImage origin = ImageIO.read(new File(input));
        if (img == null) {
            img = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
            paper = img.createGraphics();
        }
        paper.drawImage(origin, 0, 0, width, height, null);
    }

    private static void imageWatermark(String input, float a, int x, int y, int width, int height) throws Exception {
        Composite origin = paper.getComposite();
        Composite alpha = AlphaComposite.getInstance(AlphaComposite.SRC_OVER, a);
        BufferedImage mark = ImageIO.read(new File(input));
        if (paper == null) {
            paper = img.createGraphics();
        }
        paper.setComposite(alpha);
        paper.drawImage(mark, x, y, width, height, null);
        paper.setComposite(origin);
    }

    private static void imageOpen(String input) throws Exception {
        img = ImageIO.read(new File(input));
        paper = img.createGraphics();
        System.out.printf("%d %d\n", img.getWidth(), img.getHeight());
    }

    private static void imageSave(String output, String type) throws Exception {
        if (type == null) {
            String[] segments = output.split("\\.");
            if (segments.length == 1) type = "png";
                                 else type = segments[segments.length - 1];
        }
        ImageIO.write(img, type, new File(output));
        paper.dispose();
        img = null;
    }

    public static void usage() {
        System.out.println(
            "MTGoL (F) DrawAlive - Image Utils\n" +
            "    version  \n" +
            "       help  \n" +
            "       open  input_filename\n" +
            "       save  output_filename [type]\n" +
            "  thumbnail  input_filename width height\n" +
            "  watermark  watermark_filename alpha x y width height\n" +
            "\n" +
            "combination: thumbnail test.jpg 100 100 save test_thumb.jpg"
        );
    }

    public static void version() {
        System.out.println(
            "MTGoL (F) DrawAlive - Image Utils 1.0 / Seven Lju @ Feb 6, 2016\n"
        );
    }

    public static void main(String[] args) throws Exception {
        int cursor = 0, n = args.length;
        if (n == 0) {
            version(); usage();
            return;
        }

        img = null;
        while (cursor < n) {
            if ("save".compareTo(args[cursor]) == 0) {
                String type = null;
                String output = args[cursor + 1];
                if (cursor + 2 < n) type = args[cursor + 2];
                cursor += 3;
                imageSave(output, type);
            } else if("thumbnail".compareTo(args[cursor]) == 0) {
                String input = args[cursor + 1];
                int width = Integer.parseInt(args[cursor + 2]);
                int height = Integer.parseInt(args[cursor + 3]);
                cursor += 4;
                imageThumbnail(input, width, height);
            } else if("watermark".compareTo(args[cursor]) == 0) {
                String input = args[cursor + 1];
                float alpha = Float.parseFloat(args[cursor + 2]);
                int x = Integer.parseInt(args[cursor + 3]);
                int y = Integer.parseInt(args[cursor + 4]);
                int width = Integer.parseInt(args[cursor + 5]);
                int height = Integer.parseInt(args[cursor + 6]);
                cursor += 7;
                imageWatermark(input, alpha, x, y, width, height);
            } else if("open".compareTo(args[cursor]) == 0) {
                String input = args[cursor + 1];
                imageOpen(input);
                cursor += 2;
            } else if("help".compareTo(args[cursor]) == 0) {
                version(); usage(); return;
            } else if("version".compareTo(args[cursor]) == 0) {
                version(); return;
            } else {
                cursor ++;
            }
        }
    }

}
