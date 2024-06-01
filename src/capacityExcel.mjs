import ExcelJS from 'exceljs';

import capacity from './mock/mockCapacityInfo.json' assert {type: 'json'};

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

function getCompanyInfo(company) {
  const companyTitle = company.companyTitle ? company.companyTitle : '';
  const rating = company.rating ? company.rating : 0;
  const countryCode = company.countryCode ? company.countryCode : '';
  const state = company.state ? company.state : '';
  const city = company.city ? company.city : '';
  const address = company.address ? company.address : '';
  const latitude = company.latitude ? company.latitude : '';
  const longitude = company.longitude ? company.longitude : '';
  return [
    company.companyId,
    companyTitle,
    rating,
    countryCode,
    state,
    city,
    address,
    latitude,
    longitude,
  ];
}

function getCrewInfo(crew) {
  const crewTitle = crew.crewTitle ? crew.crewTitle : '';
  const countryCode = crew.countryCode ? crew.countryCode : '';
  const state = crew.state ? crew.state : '';
  const city = crew.city ? crew.city : '';
  const certifications = crew.certifications ? crew.certifications.join() : '';
  const skills = crew.skills ? crew.skills.join() : '';
  const latitude = crew.latitude ? crew.latitude : '';
  const longitude = crew.longitude ? crew.longitude : '';
  return [
    crew.companyId,
    crew.crewId,
    crewTitle,
    countryCode,
    state,
    city,
    certifications,
    skills,
    latitude,
    longitude,
  ];
}

function getAllocationIfo(allocation) {
  const scopes = allocation.scopes ? allocation.scopes.join() : 'any';
  const activitiesPercentage = allocation.activitiesPercentage
    ? allocation.activitiesPercentage
    : 1;
  return [
    allocation.programId,
    allocation.companyId,
    scopes,
    activitiesPercentage,
  ];
}

const companies = workbook.addWorksheet('Companies');

companies.addTable({
  name: 'Companies',
  ref: 'A1',
  headerRow: true,
  style: {
    theme: 'TableStyleMedium2',
  },
  columns: [
    {name: 'Company ID'},
    {name: 'Company Title'},
    {name: 'Rating'},
    {name: 'Country Code'},
    {name: 'State'},
    {name: 'City'},
    {name: 'Address'},
    {name: 'Latitude'},
    {name: 'Longitude'},
  ],
  rows: capacity.companies.map((c) => getCompanyInfo(c)),
});

const crews = workbook.addWorksheet('Crews');

crews.addTable({
  name: 'Crews',
  ref: 'A1',
  headerRow: true,
  style: {
    theme: 'TableStyleMedium2',
  },
  columns: [
    {name: 'Company ID'},
    {name: 'Crew ID'},
    {name: 'Crew Title'},
    {name: 'Country Code'},
    {name: 'State'},
    {name: 'City'},
    {name: 'Certifications'},
    {name: 'Skills'},
    {name: 'Latitude'},
    {name: 'Longitude'},
  ],
  rows: capacity.crews.map((c) => getCrewInfo(c)),
});

const allocations = workbook.addWorksheet('Allocations');

allocations.addTable({
  name: 'Allocations',
  ref: 'A1',
  headerRow: true,
  style: {
    theme: 'TableStyleMedium2',
  },
  columns: [
    {name: 'Program ID'},
    {name: 'Company ID'},
    {name: 'Scopes'},
    {name: 'Activities Percentage'},
  ],
  rows: capacity.allocations.map((a) => getAllocationIfo(a)),
});

const capacities = workbook.addWorksheet('Capacities');

capacities.addTable({
  name: 'Capacities',
  ref: 'A1',
  headerRow: true,
  style: {
    theme: 'TableStyleMedium2',
  },
  columns: [
    {name: 'Company ID'},
    {name: 'Crew ID'},
    {name: 'Work Date'},
    {name: 'Capacity'},
  ],
  rows: capacity.capacities.map((c) => Object.values(c)),
});

await workbook.xlsx.writeFile('./src/capacity.xlsx');
