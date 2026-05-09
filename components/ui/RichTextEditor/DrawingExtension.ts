
import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import DrawingComponent from './DrawingComponent';

export const DrawingExtension = Node.create({
  name: 'drawing',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      lines: {
        default: '[]',
        parseHTML: element => element.getAttribute('data-lines'),
        renderHTML: attributes => {
          return {
            'data-lines': attributes.lines,
          }
        },
      },
      width: {
        default: 400,
      },
      height: {
        default: 200,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="drawing"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'drawing' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(DrawingComponent);
  },

  addCommands() {
    return {
      setDrawing: () => ({ commands }: any) => {
        return commands.insertContent({ type: this.name });
      },
    } as any;
  },
});
