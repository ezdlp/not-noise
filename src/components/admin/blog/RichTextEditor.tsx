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
  Code,
  Text as TextIcon,
  Clock,
  SeparatorHorizontal,
  Pencil,
  Trash2,
} from 'lucide-react';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MediaLibrary } from './MediaLibrary';
import { mergeAttributes } from '@tiptap/core';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
        default: 'center',
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
        default: 'full',
        parseHTML: element => element.getAttribute('data-size'),
        renderHTML: attributes => ({
          'data-size': attributes['data-size'],
          class: `image-${attributes['data-size']}`,
        }),
      },
    };
  },
  renderHTML({ HTMLAttributes }) {
    const { 'data-link': link, 'data-link-target': target, ...rest } = HTMLAttributes;
    if (link) {
      return ['a', { href: link, target }, ['img', mergeAttributes(this.options.HTMLAttributes, rest)]];
    }
    return ['img', mergeAttributes(this.options.HTMLAttributes, rest)];
  },
});

export function RichTextEditor({ content, onChange }: { content: string; onChange: (content: string) => void }) {
  const [isMediaDialogOpen, setIsMediaDialogOpen] = useState(false);
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [isImageSettingsOpen, setIsImageSettingsOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkTarget, setLinkTarget] = useState<'_blank' | '_self'>('_self');
  const [editorMode, setEditorMode] = useState<'visual' | 'code'>('visual');
  const [htmlContent, setHtmlContent] = useState(content);
  const [wordCount, setWordCount] = useState(0);
  const [readingTime, setReadingTime] = useState(0);
  const [imageSettings, setImageSettings] = useState<ImageSettings>({
    alt: '',
    caption: '',
    link: '',
    linkTarget: '_blank',
    size: 'full',
    alignment: 'center'
  });

  const handleImageSelect = (url: string) => {
    setSelectedImage(url);
    setIsMediaDialogOpen(false);
    setIsImageSettingsOpen(true);
  };

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2]
        }
      }),
      CustomImage.configure({
        HTMLAttributes: {
          class: 'rounded-lg cursor-pointer hover:ring-2 hover:ring-primary',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          target: linkTarget,
        },
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      const newContent = editor.getHTML();
      onChange(newContent);
      setHtmlContent(newContent);
      
      const text = editor.getText();
      const words = text.trim().split(/\s+/).filter(word => word.length > 0).length;
      const readingTimeValue = Math.ceil(words / 200);
      setWordCount(words);
      setReadingTime(readingTimeValue);
    },
    editorProps: {
      attributes: {
        class: 'prose max-w-none p-4 min-h-[400px] focus:outline-none overflow-y-auto',
      },
      handleClick: (view, pos, event) => {
        const node = view.state.doc.nodeAt(pos);
        if (node?.type.name === 'image') {
          const attrs = node.attrs;
          setImageSettings({
            alt: attrs.alt || '',
            caption: attrs['data-caption'] || '',
            link: attrs['data-link'] || '',
            linkTarget: attrs['data-link-target'] || '_blank',
            size: attrs['data-size'] || 'full',
            alignment: attrs['data-alignment'] || 'center'
          });
          setIsImageSettingsOpen(true);
          return true;
        }
        return false;
      },
    },
  });

  const updateSelectedImage = () => {
    if (editor) {
      const { state, dispatch } = editor.view;
      const { from, to } = state.selection;
      
      let imagePos = null;
      state.doc.nodesBetween(from, to, (node, pos) => {
        if (node.type.name === 'image') {
          imagePos = pos;
          return false;
        }
      });

      if (imagePos !== null || selectedImage) {
        const attrs = {
          src: selectedImage || state.doc.nodeAt(imagePos)?.attrs.src,
          alt: imageSettings.alt,
          title: imageSettings.alt,
          'data-caption': imageSettings.caption,
          'data-alignment': imageSettings.alignment,
          'data-link': imageSettings.link || undefined,
          'data-link-target': imageSettings.link ? imageSettings.linkTarget : undefined,
          'data-size': imageSettings.size,
        };

        if (selectedImage) {
          editor.chain().focus().setImage(attrs).run();
        } else {
          editor.chain().focus().setImage(attrs).run();
        }

        setIsImageSettingsOpen(false);
        setSelectedImage(null);
        setImageSettings({
          alt: '',
          caption: '',
          link: '',
          linkTarget: '_blank',
          size: 'full',
          alignment: 'center'
        });
      }
    }
  };

  if (!editor) {
    return null;
  }

  return (
    <div className="border rounded-md">
      <div className="border-b p-2 flex gap-1 flex-wrap sticky top-0 bg-white z-10">
        <div className="flex items-center gap-2 w-full border-b pb-2 mb-2">
          <Tabs value={editorMode} onValueChange={(value: 'visual' | 'code') => setEditorMode(value)}>
            <TabsList>
              <TabsTrigger value="visual">Visual</TabsTrigger>
              <TabsTrigger value="code">Code</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        {editorMode === 'visual' && (
          <>
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
              type="button"
              onClick={(e) => {
                e.preventDefault();
                setIsMediaDialogOpen(true);
              }}
            >
              <ImageIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              type="button"
              onClick={(e) => {
                e.preventDefault();
                setIsLinkDialogOpen(true);
              }}
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
            <Button
              variant="ghost"
              size="icon"
              onClick={() => editor.chain().focus().setHorizontalRule().run()}
            >
              <SeparatorHorizontal className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>

      {editorMode === 'visual' && (
        <EditorContent editor={editor} className="prose max-w-none p-4 min-h-[400px] max-h-[600px] overflow-y-auto" />
      )}

      {editorMode === 'code' && (
        <div className="p-4">
          <textarea
            value={htmlContent}
            onChange={(e) => setHtmlContent(e.target.value)}
            className="w-full h-[400px] font-mono text-sm p-4 border rounded-md"
          />
        </div>
      )}

      <div className="border-t p-2 flex justify-between items-center text-sm text-muted-foreground">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <TextIcon className="h-4 w-4" />
            {wordCount} words
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {readingTime} min read
          </span>
        </div>
      </div>

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
              <Label>Size</Label>
              <Select
                value={imageSettings.size}
                onValueChange={(value: 'small' | 'medium' | 'large' | 'full') => 
                  setImageSettings({ ...imageSettings, size: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select image size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="large">Large</SelectItem>
                  <SelectItem value="full">Full Width</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Alignment</Label>
              <Select
                value={imageSettings.alignment}
                onValueChange={(value: 'left' | 'center' | 'right') => 
                  setImageSettings({ ...imageSettings, alignment: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select alignment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Left</SelectItem>
                  <SelectItem value="center">Center</SelectItem>
                  <SelectItem value="right">Right</SelectItem>
                </SelectContent>
              </Select>
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
                  onValueChange={(value: '_blank' | '_self') => setImageSettings({ ...imageSettings, linkTarget: value })}
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
            <Button onClick={updateSelectedImage}>
              {selectedImage ? 'Insert Image' : 'Update Image'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Insert Link</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>URL</Label>
              <Input
                type="url"
                placeholder="Enter URL"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Open in</Label>
              <Select
                value={linkTarget}
                onValueChange={(value: '_blank' | '_self') => setLinkTarget(value)}
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
            <Button onClick={() => {
              if (linkUrl) {
                editor?.chain().focus().setLink({ 
                  href: linkUrl,
                  target: linkTarget 
                }).run();
                setLinkUrl('');
                setIsLinkDialogOpen(false);
              }
            }}>Add Link</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isMediaDialogOpen} onOpenChange={setIsMediaDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Media Library</DialogTitle>
          </DialogHeader>
          <MediaLibrary 
            onSelect={handleImageSelect} 
            onClose={() => setIsMediaDialogOpen(false)} 
            showInsertButton={true}
          />
        </DialogContent>
      </Dialog>

      <style>
        {`
        .ProseMirror {
          min-height: 400px;
          max-height: 600px;
          overflow-y: auto;
        }
        .image-left {
          float: left;
          margin: 0.5em 1em 0.5em 0;
        }
        .image-center {
          display: block;
          margin: 0.5em auto;
        }
        .image-right {
          float: right;
          margin: 0.5em 0 0.5em 1em;
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
        .image-small {
          max-width: 25%;
        }
        .image-medium {
          max-width: 50%;
        }
        .image-large {
          max-width: 75%;
        }
        .image-full {
          max-width: 100%;
          margin: 1em 0;
        }
        .ProseMirror img {
          cursor: pointer;
          transition: all 0.2s ease-in-out;
        }
        .ProseMirror img:hover {
          box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.5);
        }
        .editor-toolbar {
          position: sticky;
          top: 0;
          background: white;
          z-index: 50;
          border-bottom: 1px solid #e2e8f0;
        }
        `}
      </style>
    </div>
  );
}

