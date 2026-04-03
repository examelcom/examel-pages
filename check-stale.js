const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '/opt/examel/pdf-engine/.env' });
const fs = require('fs');
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);
async function check() {
  const subjects = ['math','english','science','art','reading'];
  let diskTopics = [];
  for (const subj of subjects) {
    const dir = '/opt/examel/examel-pages/free-' + subj + '-worksheets';
    if (!fs.existsSync(dir)) continue;
    const entries = fs.readdirSync(dir).filter(e => {
      try { return fs.statSync(dir+'/'+e).isDirectory(); } catch(e) { return false; }
    });
    entries.forEach(e => diskTopics.push({ subj, topic: e, path: dir+'/'+e }));
  }
  console.log('Disk topic dirs:', diskTopics.length);
  let stale = [];
  for (const t of diskTopics) {
    const { count } = await sb.from('worksheets').select('*',{count:'exact',head:true}).eq('status','published').eq('subject',t.subj).eq('topic',t.topic);
    if (count === 0) stale.push(t.path);
  }
  console.log('Stale topic dirs:', stale.length);
  stale.forEach(p => console.log(p));
}
check();
