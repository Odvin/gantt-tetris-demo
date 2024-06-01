import ExcelJS from 'exceljs';

import plan from './mock/mockProgramPlan.json' assert {type: 'json'};

function getSiteInfo(site) {
  const siteId = site.siteId;
  const siteTitle = site.siteTitle ? site.siteTitle : '';
  const countryCode = site.countryCode ? site.countryCode : '';
  const state = site.state ? site.state : '';
  const city = site.city ? site.city : '';
  const address = site.address ? site.address : '';
  const latitude = site.latitude ? site.latitude : '';
  const longitude = site.longitude ? site.longitude : '';
  return [
    siteId,
    siteTitle,
    countryCode,
    state,
    city,
    address,
    latitude,
    longitude,
  ];
}

function getProjectInfo(project) {
  const projectId = project.projectId;
  const siteId = project.siteId;
  const projectTitle = project.projectTitle ? project.projectTitle : '';
  const projectStarDate = project.projectStarDate
    ? project.projectStarDate
    : '';
  const projectEndDate = project.projectEndDate ? project.projectEndDate : '';

  return [projectId, siteId, projectTitle, projectStarDate, projectEndDate];
}

function getActivityInfo(activity) {
  const scope = activity.scope ? activity.scope : '';
  const certifications = activity.certifications
    ? activity.certifications.join()
    : '';
  const skills = activity.skills ? activity.skills.join() : '';
  const priority = activity.priority ? activity.priority : 1;
  const capacity = activity.capacity ? activity.capacity : 1;

  return [
    activity.activityId,
    activity.projectId,
    activity.siteId,
    scope,
    certifications,
    skills,
    priority,
    capacity,
    activity.activityStartDate,
    activity.activityEndDate,
  ];
}

const workbook = new ExcelJS.Workbook();

workbook.creator = 'Dmytro Ovchynnykov';
workbook.lastModifiedBy = 'Dmytro Ovchynnykov';
workbook.created = new Date();
workbook.modified = new Date();

workbook.views = [
  {
    x: 0,
    y: 0,
    width: 10000,
    height: 20000,
    firstSheet: 0,
    activeTab: 1,
    visibility: 'visible',
  },
];

const program = workbook.addWorksheet('Program');

program.addTable({
  name: 'Program',
  ref: 'A1',
  headerRow: true,
  style: {
    theme: 'TableStyleMedium2',
  },
  columns: [
    {name: 'Program ID'},
    {name: 'Program Title'},
    {name: 'Start Date'},
    {name: 'End Date'},
    {name: 'Customer ID'},
    {name: 'Customer Title'},
  ],
  rows: [
    [
      plan.programId,
      plan.programTitle,
      plan.programStartDate,
      plan.programEndDate,
      plan.customerId,
      plan.customerTitle,
    ],
  ],
});

const sites = workbook.addWorksheet('Sites');

sites.addTable({
  name: 'Sites',
  ref: 'A1',
  headerRow: true,
  style: {
    theme: 'TableStyleMedium2',
  },
  columns: [
    {name: 'Site ID'},
    {name: 'Site Title'},
    {name: 'Country Code'},
    {name: 'State'},
    {name: 'City'},
    {name: 'Address'},
    {name: 'Latitude'},
    {name: 'Longitude'},
  ],
  rows: plan.sites.map((s) => getSiteInfo(s)),
});

const projects = workbook.addWorksheet('Projects');

projects.addTable({
  name: 'Projects',
  ref: 'A1',
  headerRow: true,
  style: {
    theme: 'TableStyleMedium2',
  },
  columns: [
    {name: 'Project ID'},
    {name: 'Site ID'},
    {name: 'Project Title'},
    {name: 'Start Date'},
    {name: 'End Date'},
  ],
  rows: plan.projects.map((p) => getProjectInfo(p)),
});

const activities = workbook.addWorksheet('Activities');

activities.addTable({
  name: 'Activities',
  ref: 'A1',
  headerRow: true,
  style: {
    theme: 'TableStyleMedium2',
  },
  columns: [
    {name: 'Activity ID'},
    {name: 'Project ID'},
    {name: 'Site ID'},
    {name: 'Scope'},
    {name: 'Certifications'},
    {name: 'Skills'},
    {name: 'Priority'},
    {name: 'Capacity'},
    {name: 'Start Date'},
    {name: 'End Date'},
  ],
  rows: plan.activities.map((p) => getActivityInfo(p)),
});

await workbook.xlsx.writeFile('./src/program.xlsx');
