
"use client"

import { useEffect, useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { 
  Bold, 
  Italic, 
  Underline, 
  Link, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3
} from "lucide-react"
import SubscriberList from "../subscriber/_components/SubscriberList"
import { EditorContent, Editor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import UnderlineExtension from "@tiptap/extension-underline"
import LinkExtension from "@tiptap/extension-link"
import TextAlign from "@tiptap/extension-text-align"

export default function SendEmailPage() {
  const [showSubscriberList, setShowSubscriberList] = useState(false)
  const [editor, setEditor] = useState<Editor | null>(null)
  const [isClient, setIsClient] = useState(false)
  const [subject, setSubject] = useState("")

  useEffect(() => {
    setIsClient(true)

    const tiptapEditor = new Editor({
      extensions: [
        StarterKit.configure({ 
          bulletList: { 
            keepMarks: true,
            HTMLAttributes: {
              class: "list-disc pl-5",
            },
          },
          orderedList: {
            keepMarks: true,
            HTMLAttributes: {
              class: "list-decimal pl-5",
            },
          },
          heading: {
            levels: [1, 2, 3],
            HTMLAttributes: {
              class: "font-bold",
            },
          },
        }),
        UnderlineExtension,
        LinkExtension.configure({ 
          openOnClick: false,
          HTMLAttributes: {
            class: "text-blue-500 underline",
          },
        }),
        TextAlign.configure({ 
          types: ["heading", "paragraph"],
          alignments: ['left', 'center', 'right'],
          defaultAlignment: 'left',
        }),
      ],
      content: "",
      editorProps: {
        attributes: {
          class: "prose max-w-none focus:outline-none min-h-[200px] p-4",
        },
      },
    })

    setEditor(tiptapEditor)

    return () => {
      tiptapEditor?.destroy()
    }
  }, [])

  // Mutation for sending email
  const sendEmailMutation = useMutation({
    mutationFn: async (data: { subject: string; htmlContent: string }) => {
      // Get token from localStorage (or your preferred storage method)
      const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2ODg5OWQ4NDc3MWFlNjZjOGIxN2VlNGMiLCJlbWFpbCI6InNvemliYmRjYWxsaW5nMjAyNUBnbWFpbC5jb20iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NTQxMDYzMzYsImV4cCI6MTc1NDE5MjczNn0.B5EYYzaSmZGk62prC1-OqjQlM9Ob4n9NHEAEU3tF9Ic"

      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/newsletter/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`, 
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error("Failed to send email")
      }

      return response.json()
    },
    onSuccess: () => {
      toast.success("Email sent successfully!")
      setSubject("")
      editor?.commands.clearContent()
    },
    onError: (error) => {
      toast.error(`Error sending email: ${error.message}`)
    },
  })

  const handleLink = () => {
    if (editor?.isActive('link')) {
      editor.chain().focus().unsetLink().run()
      return
    }
    
    const url = prompt("Enter the URL")
    if (url && editor) {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
    }
  }

  const handleSendEmail = () => {
    if (!editor || !subject) {
      toast.error("Please provide both subject and content")
      return
    }

    sendEmailMutation.mutate({
      subject,
      htmlContent: editor.getHTML(),
    })
  }

  if (showSubscriberList) {
    return <SubscriberList onBack={() => setShowSubscriberList(false)} />
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Send email to subscribers</h1>
        <Button className="bg-[#44B6CA] hover:bg-[#44B6CA]/85 text-white h-[44px] cursor-pointer" onClick={() => setShowSubscriberList(true)}>
          See Subscriber List
        </Button>
      </div>

      <Card className="border-none shadow-none">
        <CardHeader>
          <CardTitle>Compose Your Email</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label htmlFor="subject-line" className="block text-sm font-medium text-gray-700 mb-2">
              Subject Line
            </label>
            <input
              id="subject-line"
              placeholder="Enter your subject line..."
              className="w-full border border-gray-300 rounded-md p-2 outline-none focus:ring-0"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email Content</label>

            {isClient && editor && (
              <>
                <div className="flex items-center gap-1 p-2 border-b border-[#DFFAFF]">
                  {/* Text formatting buttons */}
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className={`w-8 h-8 ${editor.isActive('bold') ? 'bg-[#44B6CA] text-white' : 'text-[#595959]'}`}
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    disabled={!editor.can().chain().focus().toggleBold().run()}
                  >
                    <Bold className="w-4 h-4" />
                    <span className="sr-only">Bold</span>
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className={`w-8 h-8 ${editor.isActive('italic') ? 'bg-[#44B6CA] text-white' : 'text-[#595959]'}`}
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    disabled={!editor.can().chain().focus().toggleItalic().run()}
                  >
                    <Italic className="w-4 h-4" />
                    <span className="sr-only">Italic</span>
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className={`w-8 h-8 ${editor.isActive('underline') ? 'bg-[#44B6CA] text-white' : 'text-[#595959]'}`}
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                  >
                    <Underline className="w-4 h-4" />
                    <span className="sr-only">Underline</span>
                  </Button>
                  
                  {/* Text size/heading options */}
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className={`w-8 h-8 ${editor.isActive('heading', { level: 1 }) ? 'bg-[#44B6CA] text-white' : 'text-[#595959]'}`}
                    onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                  >
                    <Heading1 className="w-4 h-4" />
                    <span className="sr-only">Heading 1</span>
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className={`w-8 h-8 ${editor.isActive('heading', { level: 2 }) ? 'bg-[#44B6CA] text-white' : 'text-[#595959]'}`}
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                  >
                    <Heading2 className="w-4 h-4" />
                    <span className="sr-only">Heading 2</span>
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className={`w-8 h-8 ${editor.isActive('heading', { level: 3 }) ? 'bg-[#44B6CA] text-white' : 'text-[#595959]'}`}
                    onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                  >
                    <Heading3 className="w-4 h-4" />
                    <span className="sr-only">Heading 3</span>
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className={`w-8 h-8 ${editor.isActive('link') ? 'bg-[#44B6CA] text-white' : 'text-[#595959]'}`}
                    onClick={handleLink}
                  >
                    <Link className="w-4 h-4" />
                    <span className="sr-only">Link</span>
                  </Button>
                  
                  <div className="w-px h-6 bg-[#DFFAFF] mx-2" />
                  
                  {/* Alignment buttons */}
                  <Button 
                    variant="ghost" 
                    size="icon" 
                   className={`w-8 h-8 ${editor.isActive({ textAlign: 'center'}) ? 'bg-[#44B6CA] text-white' : 'text-[#595959]'}`}
                    onClick={() => editor.chain().focus().setTextAlign('left').run()}
                  >
                    <AlignLeft className="w-4 h-4" />
                    <span className="sr-only">Align Left</span>
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                   className={`w-8 h-8 ${editor.isActive({ textAlign: 'center'}) ? 'bg-[#44B6CA] text-white' : 'text-[#595959]'}`}
                    onClick={() => editor.chain().focus().setTextAlign('center').run()}
                  >
                    <AlignCenter className="w-4 h-4" />
                    <span className="sr-only">Align Center</span>
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                  className={`w-8 h-8 ${editor.isActive({ textAlign: 'center'}) ? 'bg-[#44B6CA] text-white' : 'text-[#595959]'}`}
                    onClick={() => editor.chain().focus().setTextAlign('right').run()}
                  >
                    <AlignRight className="w-4 h-4" />
                    <span className="sr-only">Align Right</span>
                  </Button>
                  
                  {/* List buttons */}
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className={`w-8 h-8 ${editor.isActive('bulletList') ? 'bg-[#44B6CA] text-white' : 'text-[#595959]'}`}
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                  >
                    <List className="w-4 h-4" />
                    <span className="sr-only">Bullet List</span>
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className={`w-8 h-8 ${editor.isActive('orderedList') ? 'bg-[#44B6CA] text-white' : 'text-[#595959]'}`}
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                  >
                    <ListOrdered className="w-4 h-4" />
                    <span className="sr-only">Numbered List</span>
                  </Button>
                </div>
                
                <EditorContent 
                  editor={editor} 
                  className="border border-gray-300 rounded-b-md min-h-[200px] p-4"
                />
              </>
            )}
          </div>

          <Button 
            className="bg-[#44B6CA] hover:bg-[#44B6CA]/85 text-white cursor-pointer"
            onClick={handleSendEmail}
            disabled={sendEmailMutation.isPending}
          >
            {sendEmailMutation.isPending ? "Sending..." : "Send Email"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
