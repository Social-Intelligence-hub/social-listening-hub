require('dotenv').config();
const { Client } = require('@notionhq/client');

async function getPageBlocks() {
  try {
    const notion = new Client({ auth: process.env.NOTION_TOKEN });
    const pageId = 'a18c1ade-cb0e-4822-a584-4f518f70b8f6';
    const blocks = await notion.blocks.children.list({ block_id: pageId });
    console.log('Blocks under FASE 0 page:');
    blocks.results.forEach((block, i) => {
      let text = '';
      if (block.type === 'to_do' && block.to_do.rich_text[0]) {
        text = `[${block.to_do.checked ? 'x' : ' '}] TO_DO: ${block.to_do.rich_text[0].plain_text}`;
      } else if (block.type === 'bulleted_list_item' && block.bulleted_list_item.rich_text[0]) {
        text = `• ${block.bulleted_list_item.rich_text[0].plain_text}`;
      } else if (block.type === 'paragraph' && block.paragraph.rich_text[0]) {
        text = block.paragraph.rich_text[0].plain_text;
      } else if (block[block.type] && block[block.type].rich_text && block[block.type].rich_text[0]) {
        text = `${block.type.toUpperCase()}: ${block[block.type].rich_text[0].plain_text}`;
      } else {
        text = `[${block.type}] (no rich text / empty)`;
      }
      console.log(`${i+1}. ${text} (ID: ${block.id})`);
    });
  } catch (err) {
    console.error(err);
  }
}
getPageBlocks();
