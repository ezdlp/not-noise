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

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
}

// Define the custom attributes interface
interface CustomImageAttributes {
  src: string;
  alt?: string;
  title?: string;
  'data-caption'?: string;
  'data-alignment'?: 'left' | 'center' | 'right';
}

// Extend the Image extension with custom attributes
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
  const [linkUrl, setLinkUrl] = useState('');
  const [imageAlt, setImageAlt] = useState('');
  const [imageCaption, setImageCaption] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

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

  const handleAddLink = () => {
    if (linkUrl) {
      editor.chain().focus().setLink({ href: linkUrl }).run();
      setIsLinkDialogOpen(false);
      setLinkUrl('');
    }
  };

  const handleImageSelect = (url: string) => {
    setSelectedImage(url);
    setIsImageSettingsOpen(true);
    setIsMediaDialogOpen(false);
  };

  const handleImageSettingsConfirm = () => {
    if (selectedImage) {
      const imageAttributes: CustomImageAttributes = {
        src: selectedImage,
        alt: imageAlt,
        title: imageAlt,
        'data-caption': imageCaption,
        'data-alignment': 'left',
      };

      editor
        .chain()
        .focus()
        .setImage(imageAttributes)
        .run();
      setIsImageSettingsOpen(false);
      setSelectedImage(null);
      setImageAlt('');
      setImageCaption('');
    }
  };

  const setImageAlignment = (alignment: 'left' | 'center' | 'right') => {
    editor.chain().focus().updateAttributes('image', {
      'data-alignment': alignment,
    }).run();
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

      {editor.isActive('image') && (
        <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }}>
          <div className="flex gap-1 bg-white border rounded-lg shadow-lg p-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setImageAlignment('left')}
            >
              <AlignLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setImageAlignment('center')}
            >
              <AlignCenter className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setImageAlignment('right')}
            >
              <AlignRight className="h-4 w-4" />
            </Button>
          </div>
        </BubbleMenu>
      )}

      <Dialog open={isMediaDialogOpen} onOpenChange={setIsMediaDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Media Library</DialogTitle>
          </DialogHeader>
          <MediaLibrary
            onSelect={handleImageSelect}
            onClose={() => setIsMediaDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isImageSettingsOpen} onOpenChange={setIsImageSettingsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Image Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="alt-text">Alt Text</Label>
              <Input
                id="alt-text"
                value={imageAlt}
                onChange={(e) => setImageAlt(e.target.value)}
                placeholder="Describe the image for accessibility"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="caption">Caption</Label>
              <Input
                id="caption"
                value={imageCaption}
                onChange={(e) => setImageCaption(e.target.value)}
                placeholder="Add a caption to the image"
              />
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
        `}
      </style>
    </div>
  );
}
