const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '/opt/examel/pdf-engine/.env' });
const fs = require('fs');
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);
const SKIP = ['grade-1','grade-2','grade-3','grade-4','grade-5','grade-6','grade-7','grade-8'];
async function check() {
  const subjects = ['math','english','science','art','reading'];
  let orphans = [];
  for (const subj of subjects) {
    const dir = '/opt/examel/examel-pages/free-' + subj + '-worksheets';
    if (!fs.existsSync(dir)) continue;
    const entries = fs.readdirSync(dir).filter(e => {
      if (SKIP.includes(e)) return false;
      try { return fs.statSync(dir+'/'+e).isDirectory(); } catch(e) { return false; }
    });
    for (const topic of entries) {
      const topicSpaces = topic.replace(/-/g,' ');
      const { count: c1 } = await sb.from('worksheets').select('*',{count:'exact',head:true}).eq('status','published').eq('subject',subj).eq('topic',topic).eq('format','worksheet');
      const { count: c2 } = await sb.from('worksheets').select('*',{count:'exact',head:true}).eq('status','published').eq('subject',subj).eq('topic',topicSpaces).eq('format','worksheet');
      const total = (c1||0)+(c2||0);
      if (total < 3) orphans.push({ path: dir+'/'+topic, count: total });
    }
  }
  console.log('Topic dirs below threshold (<3 worksheet-format):');
  orphans.forEach(o => console.log(' ', o.count, o.path));
}
check();
