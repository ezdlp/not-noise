import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import { Button } from "@/components/ui/button";
import { 
  Bold, 
  Italic, 
  List, 
  ListOrdered, 
  Quote, 
  Heading1, 
  Heading2, 
  ImageIcon,
  Link as LinkIcon,
  Undo,
  Redo,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from 'lucide-react';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MediaLibrary } from './MediaLibrary';
import { mergeAttributes } from '@tiptap/core';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
}

interface ImageSettings {
  alt: string;
  caption: string;
  link: string;
  linkTarget: '_blank' | '_self';
  size: 'small' | 'medium' | 'large' | 'full';
  alignment: 'left' | 'center' | 'right';
}

const CustomImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      alt: {
        default: null,
        parseHTML: element => element.getAttribute('alt'),
        renderHTML: attributes => ({
          alt: attributes.alt,
        }),
      },
      title: {
        default: null,
        parseHTML: element => element.getAttribute('title'),
        renderHTML: attributes => ({
          title: attributes.title,
        }),
      },
      'data-caption': {
        default: null,
        parseHTML: element => element.getAttribute('data-caption'),
        renderHTML: attributes => {
          if (!attributes['data-caption']) {
            return {};
          }
          return {
            'data-caption': attributes['data-caption'],
          };
        },
      },
      'data-alignment': {
        default: 'left',
        parseHTML: element => element.getAttribute('data-alignment'),
        renderHTML: attributes => ({
          'data-alignment': attributes['data-alignment'],
          class: `image-${attributes['data-alignment']}`,
        }),
      },
      'data-link': {
        default: null,
        parseHTML: element => element.getAttribute('data-link'),
        renderHTML: attributes => ({
          'data-link': attributes['data-link'],
        }),
      },
      'data-link-target': {
        default: '_blank',
        parseHTML: element => element.getAttribute('data-link-target'),
        renderHTML: attributes => ({
          'data-link-target': attributes['data-link-target'],
        }),
      },
      'data-size': {
        default: 'medium',
        parseHTML: element => element.getAttribute('data-size'),
        renderHTML: attributes => ({
          'data-size': attributes['data-size'],
        }),
      },
    };
  },
  renderHTML({ HTMLAttributes }) {
    return ['img', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes)];
  },
});

export function RichTextEditor({ content, onChange }: RichTextEditorProps) {
  const [isMediaDialogOpen, setIsMediaDialogOpen] = useState(false);
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [isImageSettingsOpen, setIsImageSettingsOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageSettings, setImageSettings] = useState<ImageSettings>({
    alt: '',
    caption: '',
    link: '',
    linkTarget: '_blank',
    size: 'medium',
    alignment: 'left'
  });

  const editor = useEditor({
    extensions: [
      StarterKit,
      CustomImage,
      Link.configure({
        openOnClick: false,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  if (!editor) {
    return null;
  }

  const handleImageSelect = (url: string) => {
    setSelectedImage(url);
    setIsImageSettingsOpen(true);
    setIsMediaDialogOpen(false);
  };

  const handleImageSettingsConfirm = () => {
    if (selectedImage) {
      const imageAttributes = {
        src: selectedImage,
        alt: imageSettings.alt,
        title: imageSettings.alt,
        'data-caption': imageSettings.caption,
        'data-alignment': imageSettings.alignment,
        'data-link': imageSettings.link || undefined,
        'data-link-target': imageSettings.link ? imageSettings.linkTarget : undefined,
        'data-size': imageSettings.size,
        class: `image-${imageSettings.alignment} image-${imageSettings.size}`
      };

      editor
        .chain()
        .focus()
        .setImage(imageAttributes)
        .run();

      setIsImageSettingsOpen(false);
      setSelectedImage(null);
      setImageSettings({
        alt: '',
        caption: '',
        link: '',
        linkTarget: '_blank',
        size: 'medium',
        alignment: 'left'
      });
    }
  };

  return (
    <div className="border rounded-md">
      <div className="border-b p-2 flex gap-1 flex-wrap">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => editor.chain().focus().toggleBold().run()}
          data-active={editor.isActive('bold')}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          data-active={editor.isActive('italic')}
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          data-active={editor.isActive('bulletList')}
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          data-active={editor.isActive('orderedList')}
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          data-active={editor.isActive('blockquote')}
        >
          <Quote className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          data-active={editor.isActive('heading', { level: 1 })}
        >
          <Heading1 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          data-active={editor.isActive('heading', { level: 2 })}
        >
          <Heading2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsMediaDialogOpen(true)}
        >
          <ImageIcon className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsLinkDialogOpen(true)}
        >
          <LinkIcon className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => editor.chain().focus().undo().run()}
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => editor.chain().focus().redo().run()}
        >
          <Redo className="h-4 w-4" />
        </Button>
      </div>

      <EditorContent editor={editor} className="prose max-w-none p-4" />

      <Dialog open={isImageSettingsOpen} onOpenChange={setIsImageSettingsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Image Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="alt-text">Alt Text</Label>
              <Input
                id="alt-text"
                value={imageSettings.alt}
                onChange={(e) => setImageSettings({ ...imageSettings, alt: e.target.value })}
                placeholder="Describe the image for accessibility"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="caption">Caption</Label>
              <Input
                id="caption"
                value={imageSettings.caption}
                onChange={(e) => setImageSettings({ ...imageSettings, caption: e.target.value })}
                placeholder="Add a caption to the image"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="image-link">Link URL (optional)</Label>
              <Input
                id="image-link"
                type="url"
                value={imageSettings.link}
                onChange={(e) => setImageSettings({ ...imageSettings, link: e.target.value })}
                placeholder="https://example.com"
              />
            </div>
            {imageSettings.link && (
              <div className="space-y-2">
                <Label htmlFor="link-target">Link Target</Label>
                <Select
                  value={imageSettings.linkTarget}
                  onValueChange={(value: '_blank' | '_self') => 
                    setImageSettings({ ...imageSettings, linkTarget: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select link target" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_blank">New Window</SelectItem>
                    <SelectItem value="_self">Same Window</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="image-size">Image Size</Label>
              <Select
                value={imageSettings.size}
                onValueChange={(value: 'small' | 'medium' | 'large' | 'full') => 
                  setImageSettings({ ...imageSettings, size: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select image size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small (25%)</SelectItem>
                  <SelectItem value="medium">Medium (50%)</SelectItem>
                  <SelectItem value="large">Large (75%)</SelectItem>
                  <SelectItem value="full">Full Width (100%)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Alignment</Label>
              <div className="flex gap-2">
                <Button
                  variant={imageSettings.alignment === 'left' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setImageSettings({ ...imageSettings, alignment: 'left' })}
                >
                  <AlignLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant={imageSettings.alignment === 'center' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setImageSettings({ ...imageSettings, alignment: 'center' })}
                >
                  <AlignCenter className="h-4 w-4" />
                </Button>
                <Button
                  variant={imageSettings.alignment === 'right' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setImageSettings({ ...imageSettings, alignment: 'right' })}
                >
                  <AlignRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <Button onClick={handleImageSettingsConfirm}>Insert Image</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Insert Link</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              type="url"
              placeholder="Enter URL"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
            />
            <Button onClick={handleAddLink}>Add Link</Button>
          </div>
        </DialogContent>
      </Dialog>

      <style>
        {`
        .image-left {
          float: left;
          margin: 0 1em 0.5em 0;
          max-width: 50%;
        }
        .image-center {
          display: block;
          margin: 0.5em auto;
          max-width: 100%;
        }
        .image-right {
          float: right;
          margin: 0 0 0.5em 1em;
          max-width: 50%;
        }
        img[data-caption] {
          display: inline-block;
          position: relative;
        }
        img[data-caption]::after {
          content: attr(data-caption);
          display: block;
          text-align: center;
          font-style: italic;
          margin-top: 0.5em;
          font-size: 0.875em;
          color: #666;
        }
        img[data-size="small"] {
          max-width: 25%;
        }
        img[data-size="medium"] {
          max-width: 50%;
        }
        img[data-size="large"] {
          max-width: 75%;
        }
        img[data-size="full"] {
          max-width: 100%;
        }
        `}
      </style>
    </div>
  );
}
