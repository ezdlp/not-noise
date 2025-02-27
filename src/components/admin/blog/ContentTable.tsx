
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Eye } from "lucide-react";

interface ContentTableProps {
  posts: any[];
  onEdit: (post: any) => void;
  onDelete: (postId: string) => void;
  getContentType: (post: any) => string;
  getContentTypeBadgeVariant: (type: string) => string;
  getStatusBadgeVariant: (status: string) => string;
}

export default function ContentTable({
  posts,
  onEdit,
  onDelete,
  getContentType,
  getContentTypeBadgeVariant,
  getStatusBadgeVariant
}: ContentTableProps) {
  return (
    <div className="rounded-md border border-[#E6E6E6]">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-[#FAFAFA]">
            <TableHead className="text-night font-medium">Title</TableHead>
            <TableHead className="text-night font-medium">Type</TableHead>
            <TableHead className="text-night font-medium">Status</TableHead>
            <TableHead className="text-night font-medium">Published Date</TableHead>
            <TableHead className="text-night font-medium">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {posts?.map((post) => {
            const contentType = getContentType(post);
            return (
              <TableRow key={post.id} className="hover:bg-[#ECE9FF]">
                <TableCell className="font-medium text-night">{post.title}</TableCell>
                <TableCell>
                  <Badge className={getContentTypeBadgeVariant(contentType)}>
                    {contentType}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge className={getStatusBadgeVariant(post.status)}>
                    {post.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-[#666666]">
                  {post.published_at 
                    ? new Date(post.published_at).toLocaleDateString()
                    : "Not published"}
                </TableCell>
                <TableCell className="space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(post)}
                    className="text-night hover:text-primary hover:bg-primary-light"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(post.id)}
                    className="text-night hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    asChild
                    className="text-night hover:text-primary hover:bg-primary-light"
                  >
                    <a href={`/${post.slug}`} target="_blank" rel="noopener noreferrer">
                      <Eye className="h-4 w-4" />
                    </a>
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
