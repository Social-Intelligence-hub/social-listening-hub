require('dotenv').config();
const { Client } = require('@notionhq/client');

async function test() {
  const notion = new Client({ auth: process.env.NOTION_TOKEN });
  console.log('notion.databases methods:', Object.keys(notion.databases));
}
test();
