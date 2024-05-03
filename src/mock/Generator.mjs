import * as fs from 'fs';

import {faker} from '@faker-js/faker';

import skills from './skills.json' assert {type: 'json'};
import certifications from './certifications.json' assert {type: 'json'};
import scopes from './scopes.json' assert {type: 'json'};

const config = {
  programStartDate: '2024-01-01',
  programEndDate: '2024-04-20',
  maxSites: 5,
  siteLocationProbability: 0.25,
  maxProjectPerSite: 5,
  projectDateFrameProbability: 0.5,
  maxActivityPerProject: 7,
  scopePresenceProbability: 0.3,
  skillsPresenceProbability: 0.3,
  maxSkillsRequired: 3,
  certificationsPresenceProbability: 0.3,
  maxCertificationsRequired: 2,
  maxCompanies: 4,
  companyLocationProbability: 0.5,
  maxCrewPerCompany: 5,
  crewLocationProbability: 0.25,
  allocationScopeProbability: 0.25,
  maxScopesPerAllocation: 2,
  crewSkillPresenceProbability: 0.5,
  maxSkillsPerCrew: 3,
  crewCertificationPresenceProbability: 0.5,
  maxCertificationsPerCrew: 3,
};

const addDays = (date, days) => {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().split('T')[0];
};

const getDates = (start, end) => {
  const dates = [];
  const startDate = new Date(start);
  const endDate = new Date(end);

  if (startDate >= endDate) {
    throw Error('Incorrect days range');
  }

  let currentDate = startDate;

  while (currentDate <= endDate) {
    dates.push(currentDate.toISOString().split('T')[0]);
    currentDate.setUTCDate(currentDate.getUTCDate() + 1);
  }

  return dates;
};

const getInternalRange = (formDate, toDate) => {
  const dateA = faker.date.between({
    from: formDate,
    to: toDate,
  });

  const dateB = faker.date.between({
    from: formDate,
    to: toDate,
  });

  return dateA >= dateB
    ? {
        start: dateB.toISOString().split('T')[0],
        end: dateA.toISOString().split('T')[0],
      }
    : {
        start: dateA.toISOString().split('T')[0],
        end: dateB.toISOString().split('T')[0],
      };
};

class Generator {
  getProgram() {
    return {
      programId: faker.string.uuid(),
      programTitle: faker.company.catchPhrase(),
      programStartDate: config.programStartDate,
      programEndDate: config.programEndDate,
      customerId: faker.string.uuid(),
      customerTitle: faker.company.name(),
    };
  }

  getSites() {
    const sitesNumber = faker.number.int({min: 1, max: config.maxSites});
    const sites = [];

    for (let i = 0; i < sitesNumber; i++) {
      let location = faker.helpers.maybe(
        () => ({
          latitude: faker.location.latitude(),
          longitude: faker.location.longitude(),
        }),
        {probability: config.siteLocationProbability}
      );

      sites.push({
        siteId: faker.string.uuid(),
        siteTitle: faker.string.alpha({length: 7, casing: 'upper'}),
        countryCode: faker.location.countryCode('alpha-2'),
        state: faker.location.state(),
        city: faker.location.city(),
        address: faker.location.streetAddress(true),
        ...location,
      });
    }

    return sites;
  }

  getProjects(siteIds) {
    const projects = [];
    for (let siteId of siteIds) {
      const projectNumber = faker.number.int({
        min: 1,
        max: config.maxProjectPerSite,
      });
      for (let i = 0; i < projectNumber; i++) {
        let dateFrame = faker.helpers.maybe(
          () => {
            const {start, end} = getInternalRange(
              config.programStartDate,
              config.programEndDate
            );

            return {
              projectStarDate: start,
              projectEndDate: end,
            };
          },
          {probability: config.projectDateFrameProbability}
        );

        projects.push({
          projectId: faker.string.uuid(),
          siteId,
          projectTitle: faker.lorem.slug(3),
          ...dateFrame,
        });
      }
    }

    return projects;
  }

  getActivities(projects) {
    const activities = [];

    for (let project of projects) {
      const activityNumber = faker.number.int({
        min: 1,
        max: config.maxActivityPerProject,
      });

      for (let i = 0; i < activityNumber; i++) {
        let reqScope = faker.helpers.maybe(
          () => faker.helpers.arrayElement(scopes),
          {
            probability: config.scopePresenceProbability,
          }
        );

        let reqSkills = faker.helpers.maybe(
          () => {
            const ss = [];
            const s = faker.number.int(config.maxSkillsRequired);
            for (let i = 0; i < s; i++) {
              ss.push(faker.helpers.arrayElement(skills));
            }
            return ss;
          },
          {
            probability: config.skillsPresenceProbability,
          }
        );

        let reqCertifications = faker.helpers.maybe(
          () => {
            const cs = [];
            const c = faker.number.int(config.maxCertificationsRequired);
            for (let i = 0; i < c; i++) {
              cs.push(faker.helpers.arrayElement(certifications));
            }
            return cs;
          },
          {
            probability: config.certificationsPresenceProbability,
          }
        );

        const {start, end} = getInternalRange(
          project.projectStarDate
            ? project.projectStarDate
            : config.programStartDate,
          project.projectEndDate
            ? project.projectEndDate
            : config.programEndDate
        );

        activities.push({
          activityId: faker.string.uuid(),
          projectId: project.projectId,
          siteId: project.siteId,
          scope: reqScope,
          certifications: reqCertifications,
          skills: reqSkills,
          priority: faker.number.int({min: 1, max: 3}),
          capacity: faker.number.int({min: 1, max: 3}),
          activityStartDate: start,
          activityEndDate: end,
        });
      }
    }

    return activities;
  }

  getCapacity() {
    return {
      capacityInfoId: faker.string.uuid(),
      createdAt: new Date(Date.now()).toISOString(),
    };
  }

  getCompanies() {
    const companiesNumber = faker.number.int({
      min: 1,
      max: config.maxCompanies,
    });
    const companies = [];

    for (let i = 0; i < companiesNumber; i++) {
      let location = faker.helpers.maybe(
        () => ({
          latitude: faker.location.latitude(),
          longitude: faker.location.longitude(),
        }),
        {probability: config.companyLocationProbability}
      );

      companies.push({
        companyId: faker.string.uuid(),
        companyTitle: faker.company.name(),
        rating: faker.number.int({min: 1, max: 100}),
        countryCode: faker.location.countryCode('alpha-2'),
        state: faker.location.state(),
        city: faker.location.city(),
        address: faker.location.streetAddress(true),
        ...location,
      });
    }

    return companies;
  }

  getCrews(companiesIds) {
    const crews = [];
    for (let companyId of companiesIds) {
      const crewNumber = faker.number.int({
        min: 1,
        max: config.maxCrewPerCompany,
      });
      for (let i = 0; i < crewNumber; i++) {
        let location = faker.helpers.maybe(
          () => ({
            latitude: faker.location.latitude(),
            longitude: faker.location.longitude(),
          }),
          {probability: config.crewLocationProbability}
        );

        let crewSkills = faker.helpers.maybe(
          () => {
            const ss = [];
            const s = faker.number.int(config.maxSkillsPerCrew);
            for (let i = 0; i < s; i++) {
              ss.push(faker.helpers.arrayElement(skills));
            }
            return ss;
          },
          {
            probability: config.crewSkillPresenceProbability,
          }
        );

        let crewCertifications = faker.helpers.maybe(
          () => {
            const cs = [];
            const c = faker.number.int(config.maxCertificationsPerCrew);
            for (let i = 0; i < c; i++) {
              cs.push(faker.helpers.arrayElement(certifications));
            }
            return cs;
          },
          {
            probability: config.crewCertificationPresenceProbability,
          }
        );

        crews.push({
          companyId,
          crewId: faker.string.uuid(),
          crewTitle: faker.lorem.slug(3),
          countryCode: faker.location.countryCode('alpha-2'),
          state: faker.location.state(),
          city: faker.location.city(),
          certifications: crewCertifications,
          skills: crewSkills,
          ...location,
        });
      }
    }

    return crews;
  }

  getAllocations(programId, companiesIds) {
    const allocations = [];
    const percentages = [];
    for (let i = 0; i < companiesIds.length; i++) {
      percentages.push(
        faker.number.int({
          min: 1,
          max: Math.floor(100 / companiesIds.length),
        })
      );
    }

    let subtotal = 0;
    for (let i = 0; i < percentages.length - 1; i++) {
      subtotal = subtotal + percentages[i];
    }
    percentages[percentages.length - 1] = 100 - subtotal;

    for (let j = 0; j < companiesIds.length; j++) {
      const allocatedScopesSet = new Set();
      const c = faker.number.int(config.maxScopesPerAllocation);
      for (let i = 0; i < c; i++) {
        allocatedScopesSet.add(faker.helpers.arrayElement(scopes));
      }

      const allocatedScopes = [];
      faker.helpers.maybe(() => allocatedScopes.push(...allocatedScopesSet), {
        probability: config.allocationScopeProbability,
      });

      if (!allocatedScopes.length) {
        allocatedScopes.push('any');
      }

      allocations.push({
        programId,
        companyId: companiesIds[j],
        scopes: allocatedScopes,
        activitiesPercentage: percentages[j],
      });
    }

    return allocations;
  }

  getCapacities(crews) {
    const capacities = [];
    for (let crew of crews) {
      const dates = getDates(config.programStartDate, config.programEndDate);
      for (let date of dates) {
        capacities.push({
          companyId: crew.companyId,
          crewId: crew.crewId,
          workDate: date,
          capacity: faker.helpers.arrayElement([
            0.5, 1, 1, 1, 1, 1, 1, 1, 1, 1,
          ]),
        });
      }
    }
    return capacities;
  }

  generateProgramPlan() {
    const program = this.getProgram();
    const sites = this.getSites();
    const projects = this.getProjects(sites.map((s) => s.siteId));
    const activities = this.getActivities(projects);

    fs.writeFileSync(
      './src/mock/mockProgramPlan.json',
      JSON.stringify({
        ...program,
        sites,
        projects,
        activities: activities.sort((a, b) => a.siteId.localeCompare(b.siteId)),
      })
    );

    return program.programId;
  }

  generateCapacityInfo(programId) {
    const capacity = this.getCapacity();
    const companies = this.getCompanies();
    const companiesIds = companies.map((c) => c.companyId);
    const crews = this.getCrews(companiesIds);
    const allocations = this.getAllocations(programId, companiesIds);
    const capacities = this.getCapacities(crews);

    fs.writeFileSync(
      './src/mock/mockCapacityInfo.json',
      JSON.stringify({
        ...capacity,
        companies,
        crews,
        allocations,
        capacities,
      })
    );
  }
}

const generator = new Generator();

const programId = generator.generateProgramPlan();

generator.generateCapacityInfo(programId);

// console.log(JSON.stringify(generator.getProgram(), null, 4));

// console.log(JSON.stringify(generator.getSites(), null, 4));

// console.log(
//   JSON.stringify(
//     generator.getProjects([
//       '93408039-532b-4062-a478-5a2391504aac',
//       'cf61e840-e790-4e7b-9e81-adf3af98ce5e',
//     ]),
//     null,
//     4
//   )
// );

// const projects = generator.getProjects([
//   '93408039-532b-4062-a478-5a2391504aac',
//   'cf61e840-e790-4e7b-9e81-adf3af98ce5e',
// ]);

// console.log(JSON.stringify(generator.getActivities(projects), null, 4));

// console.log(JSON.stringify(generator.getCapacity(), null, 4));

// console.log(JSON.stringify(generator.getCompanies(), null, 4));

// console.log(
//   JSON.stringify(
//     generator.getCrews([
//       '93408039-532b-4062-a478-5a2391504aac',
//       'cf61e840-e790-4e7b-9e81-adf3af98ce5e',
//     ]),
//     null,
//     4
//   )
// );

// console.log(
//   JSON.stringify(
//     generator.getAllocations('93408039-532b-4062-a478-5a2391504aaa', [
//       '93408039-532b-4062-a478-5a2391504aac',
//       'cf61e840-e790-4e7b-9e81-adf3af98ce5e',
//       'af61e840-e790-4e7b-9e81-adf3af98ce7e',
//     ]),
//     null,
//     4
//   )
// );

// const crews = generator.getCrews([
//   '93408039-532b-4062-a478-5a2391504aac',
//   'cf61e840-e790-4e7b-9e81-adf3af98ce5e',
// ]);

// console.log(JSON.stringify(generator.getCapacities(crews), null, 4));
