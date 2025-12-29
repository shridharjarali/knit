import { SubTask } from '../types';

export const generateArtifact = (tasks: SubTask[]): string => {
  let htmlContent = '';
  let cssContent = '';
  let jsContent = '';

  // Helper to extract code blocks
  const extractCode = (text: string, lang: string) => {
    const regex = new RegExp(`\`\`\`${lang}([\\s\\S]*?)\`\`\``, 'gi');
    let match;
    let code = '';
    while ((match = regex.exec(text)) !== null) {
      code += match[1] + '\n';
    }
    return code;
  };

  tasks.forEach(task => {
    if (task.result) {
      htmlContent += extractCode(task.result, 'html');
      cssContent += extractCode(task.result, 'css');
      jsContent += extractCode(task.result, 'javascript');
      jsContent += extractCode(task.result, 'js');
    }
  });

  // If we found a full HTML document in the snippets, we might want to use it.
  // However, simply concatenating might break things if multiple snippets have <html> tags.
  // For this MVP, we'll assume if there's an <html> tag, we prioritize that, 
  // but let's try to be smart: if we have snippets, we wrap them.
  
  // If the accumulated HTML content contains <html>, it's likely a complete file.
  if (htmlContent.includes('<html')) {
      return htmlContent;
  }

  // Otherwise, wrap snippets in a template
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Generated Artifact</title>
    <style>
        ${cssContent}
    </style>
</head>
<body>
    ${htmlContent}
    <script>
        ${jsContent}
    </script>
</body>
</html>`;
};

export const downloadArtifact = (filename: string, content: string) => {
  const blob = new Blob([content], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
