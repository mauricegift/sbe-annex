import React from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = "Start writing...",
  className = ""
}) => {
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      [{ 'font': [] }],
      [{ 'size': ['small', false, 'large', 'huge'] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'script': 'sub'}, { 'script': 'super' }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      [{ 'direction': 'rtl' }],
      [{ 'align': [] }],
      ['link', 'image', 'video'],
      ['code-block'],
      ['clean']
    ]
  };

  const formats = [
    'header', 'font', 'size',
    'bold', 'italic', 'underline', 'strike',
    'color', 'background',
    'script',
    'list', 'bullet',
    'indent',
    'direction', 'align',
    'link', 'image', 'video',
    'code-block'
  ];

  return (
    <div className={`rich-text-editor ${className}`}>
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        style={{
          backgroundColor: 'hsl(var(--background))',
          color: 'hsl(var(--foreground))',
        }}
      />
      <style dangerouslySetInnerHTML={{
        __html: `
        .ql-toolbar {
          border: 1px solid hsl(var(--border)) !important;
          background: hsl(var(--background)) !important;
        }
        
        .ql-container {
          border: 1px solid hsl(var(--border)) !important;
          background: hsl(var(--background)) !important;
          color: hsl(var(--foreground)) !important;
        }
        
        .ql-editor {
          color: hsl(var(--foreground)) !important;
          min-height: 200px;
        }
        
        .ql-editor.ql-blank::before {
          color: hsl(var(--muted-foreground)) !important;
        }
        
        .ql-toolbar .ql-stroke {
          stroke: hsl(var(--foreground)) !important;
        }
        
        .ql-toolbar .ql-fill {
          fill: hsl(var(--foreground)) !important;
        }
        
        .ql-toolbar button:hover {
          background: hsl(var(--muted)) !important;
        }
        
        .ql-toolbar button.ql-active {
          background: hsl(var(--primary)) !important;
          color: hsl(var(--primary-foreground)) !important;
        }
        
        .ql-picker-label {
          color: hsl(var(--foreground)) !important;
        }
        
        .ql-picker-options {
          background: hsl(var(--background)) !important;
          border: 1px solid hsl(var(--border)) !important;
        }
        
        .ql-picker-item {
          color: hsl(var(--foreground)) !important;
        }
        
        .ql-picker-item:hover {
          background: hsl(var(--muted)) !important;
        }
        `
      }} />
    </div>
  );
};

export default RichTextEditor;