"use client"

import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import 'quill/dist/quill.snow.css';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export interface RichTextEditorRef {
    insertContent: (html: string) => void;
}

export const RichTextEditor = forwardRef<RichTextEditorRef, RichTextEditorProps>(({ value, onChange, placeholder }, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<any>(null); 
  const isInternalChange = useRef(false);

  useImperativeHandle(ref, () => ({
      insertContent: (html: string) => {
          if (quillRef.current) {
              // Ensure editor has focus to interact with selection
              quillRef.current.focus();
              
              const range = quillRef.current.getSelection();
              const index = range ? range.index : quillRef.current.getLength();
              
              // Insert the HTML
              quillRef.current.clipboard.dangerouslyPasteHTML(index, html);
              
              // Move cursor to after the inserted content
              // We need to estimate length or just push it to the end if at end
              // A simple generic move is hard without knowing the length of inserted blot, 
              // but usually focusing after helps.
              setTimeout(() => {
                  quillRef.current.setSelection(index + 1); // rough attempt to move past
              }, 0)
          }
      }
  }));

  useEffect(() => {
    let quillInstance: any = null;

    const initQuill = async () => {
        if (editorRef.current && toolbarRef.current && !quillRef.current) {
            const { default: Quill } = await import('quill');
            
            quillInstance = new Quill(editorRef.current, {
                theme: 'snow',
                placeholder: placeholder || 'Írjon be valamit...',
                modules: {
                    toolbar: {
                        container: toolbarRef.current,
                        handlers: {
                            // verify custom handlers if needed
                        }
                    }
                }
            });

            quillInstance.on('text-change', () => {
                isInternalChange.current = true;
                onChange(quillInstance.root.innerHTML);
                isInternalChange.current = false;
            });

            quillRef.current = quillInstance;
            
            // Set initial value
            if (value) {
                quillInstance.root.innerHTML = value;
            }
        }
    };

    initQuill();

    return () => {
        if (quillInstance) {
           // No explicit cleanup needed for toolbar as React removes the div
        }
        if (editorRef.current) {
            editorRef.current.innerHTML = '';
        }
        quillRef.current = null;
    };
  }, []);

  // Sync value from props to editor (if changed externally)
  useEffect(() => {
    if (quillRef.current && value !== quillRef.current.root.innerHTML && !isInternalChange.current) {
       if (value === '' || value !== quillRef.current.root.innerHTML) {
          quillRef.current.root.innerHTML = value;
       }
    }
  }, [value]);

  return (
    <div className="bg-background text-foreground text-black flex flex-col" ref={containerRef}> 
      {/* Explicit Toolbar Container */}
      <div ref={toolbarRef}>
          {/* Default buttons configuration structure matching Quill's expectation involved? 
              No, if we pass container element, Quill renders into it. 
              But we need to pass the CONFIGURATION to modules, and the CONTAINER to properties?
              Actually, usually we pass `toolbar: containerElem`.
              Wait, if we pass an element, Quill uses it as the toolbar. It EXPECTS the buttons to be there?
              Or does it fill it? 
              
              If we pass an element that is EMPTY, Quill might not fill it if we don't provide the layout.
              Let's revert to providing an explicit button layout inside React or configure Quill to fill it?
              
              Quill docs: "toolbar: '#toolbar'" -> Looks for id.
              "toolbar: { container: '#toolbar' }" -> Also works.
              
              If we want Quill to generate the buttons based on the array, we check if it supports render into element.
              
              Actually, simpler fix for avoiding double toolbars in ReactStrict mode is just checking refs.
              But let's try the container approach. If this fails to render buttons, we need to supply them manually.
              
              Let's provide the structure manually then! usage is safer.
          */}
           <span className="ql-formats">
            <select className="ql-header" defaultValue="">
              <option value="1"></option>
              <option value="2"></option>
              <option value="3"></option>
              <option value=""></option>
            </select>
          </span>
          <span className="ql-formats">
            <button className="ql-bold"></button>
            <button className="ql-italic"></button>
            <button className="ql-underline"></button>
            <button className="ql-strike"></button>
            <button className="ql-blockquote"></button>
          </span>
          <span className="ql-formats">
            <button className="ql-list" value="ordered"></button>
            <button className="ql-list" value="bullet"></button>
          </span>
          <span className="ql-formats">
            <button className="ql-link"></button>
            <button className="ql-clean"></button>
          </span>
      </div>
      
      <div ref={editorRef} className="h-[300px] mb-12 text-black" />
    </div>
  );
});

RichTextEditor.displayName = "RichTextEditor";
