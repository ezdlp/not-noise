import { FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RichTextEditor } from "./RichTextEditor";
import { SeoSection } from "./seo/SeoSection";
import { useState } from "react";

export function PostContent({ form }: any) {
  const [focusKeyword, setFocusKeyword] = useState(form.getValues().focus_keyword || '');
  const [seoTitle, setSeoTitle] = useState(form.getValues().seo_title || '');
  const [metaDescription, setMetaDescription] = useState(form.getValues().meta_description || '');
  const [ogTitle, setOgTitle] = useState('');
  const [ogDescription, setOgDescription] = useState('');
  const [ogImage, setOgImage] = useState('');

  const baseUrl = window.location.origin;
  const postUrl = `${baseUrl}/${form.getValues().slug || ''}`;

  return (
    <div className="space-y-8">
      <FormField
        control={form.control}
        name="title"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Title</FormLabel>
            <FormControl>
              <Input placeholder="Enter title" {...field} />
            </FormControl>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="content"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Content</FormLabel>
            <FormControl>
              <RichTextEditor
                content={field.value}
                onChange={field.onChange}
              />
            </FormControl>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="excerpt"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Excerpt</FormLabel>
            <FormControl>
              <Input placeholder="Enter excerpt" {...field} />
            </FormControl>
          </FormItem>
        )}
      />

      <SeoSection
        title={form.getValues().title}
        content={form.getValues().content}
        focusKeyword={focusKeyword}
        onFocusKeywordChange={(value) => {
          setFocusKeyword(value);
          form.setValue('focus_keyword', value, { 
            shouldDirty: true,
            shouldValidate: true,
          });
        }}
        seoTitle={seoTitle}
        onSeoTitleChange={(value) => {
          setSeoTitle(value);
          form.setValue('seo_title', value, {
            shouldDirty: true,
            shouldValidate: true,
          });
        }}
        metaDescription={metaDescription}
        onMetaDescriptionChange={(value) => {
          setMetaDescription(value);
          form.setValue('meta_description', value, {
            shouldDirty: true,
            shouldValidate: true,
          });
        }}
        ogTitle={ogTitle}
        onOgTitleChange={setOgTitle}
        ogDescription={ogDescription}
        onOgDescriptionChange={setOgDescription}
        ogImage={ogImage}
        onOgImageChange={setOgImage}
        url={postUrl}
      />
    </div>
  );
}