import * as fs from 'fs';
import * as path from 'path';

import Mustache from 'mustache';

import plan from './mock/mockProgramPlan.json' assert {type: 'json'};

const template = `
  <!DOCTYPE html>
  <html lang="en">
  {{>head}}
    <body>
      {{>program}}
      {{>sites}}
      {{>projects}}
      {{>activities}}
      <pre class="mermaid">
        {{>programPlan}}
      </pre>
      {{>scripts}}
    </body>
  </html>`;

const planActivities = [];
const siteSet = new Set();
const siteMap = new Map();

for (let a of plan.activities) {
  if (siteSet.has(a.siteId)) {
    siteMap.get(a.siteId).push({
      start: a.activityStartDate,
      end: a.activityEndDate,
      id: a.activityId.split('-')[0],
      c: a.capacity,
      p: a.priority,
    });
  } else {
    siteMap.set(a.siteId, [
      {
        start: a.activityStartDate,
        end: a.activityEndDate,
        id: a.activityId.split('-')[0],
        c: a.capacity,
        p: a.priority,
      },
    ]);
    siteSet.add(a.siteId);
  }
}

for (let siteKey of siteMap.keys()) {
  planActivities.push({
    site: plan.sites.find((s) => s.siteId === siteKey).siteTitle,
    activities: siteMap.get(siteKey),
  });
}

const data = {
  plan,
  planActivities,
};

function loadSharedPartials() {
  const partials = {};
  const files = fs.readdirSync('./src/templates');

  for (let file of files) {
    if (file.match(/\.partial\.mustache$/)) {
      let name = path.basename(file, '.partial.mustache');
      partials[name] = fs.readFileSync(`./src/templates/${file}`, {
        encoding: 'utf8',
      });
    }
  }

  return partials;
}

try {
  const output = Mustache.render(template, data, loadSharedPartials());

  fs.writeFileSync('./src/index.html', output);
} catch (error) {
  console.error(error);
  throw error;
}
