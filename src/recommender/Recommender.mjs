export default class Recommender {
  static version = '1.0.0';

  #config = {
    excludeWeekends: true,
    excludedWorkDates: [],
    permissibleCapacityDiscrepancy: 1,
    crewRecommended: true,
    considerScopes: true,
    considerCertifications: true,
    considerSkills: true,
    considerAllocations: true,
  };

  // -> statistics
  #requiredCapacity = 0;
  #providedCapacity = 0;
  // <- statistics

  #programId;
  #customerId;

  #capacityInfoId;
  #capacityCreatedAt;

  #sites = new Map();
  #projects = new Map();
  #activities = new Map();

  #companies = new Map();

  #orderedActivities = [];

  #setDate(dateString) {
    const regEx = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateString.match(regEx))
      throw Error(`Date format is not match yyyy-mm-dd : ${dateString}`);

    const d = new Date(dateString);
    const dNum = d.getTime();
    if (!dNum && dNum !== 0) throw Error('Invalid date');

    return dateString;
  }

  #setList(attributes) {
    return attributes && Array.isArray(attributes) && attributes.length
      ? attributes
      : [];
  }

  #getDates(start, end) {
    const dates = [];
    const startDate = new Date(start);
    const endDate = new Date(end);

    if (startDate > endDate) {
      throw Error('Incorrect days range');
    }

    let currentDate = startDate;

    while (currentDate <= endDate) {
      dates.push(currentDate.toISOString().split('T')[0]);
      currentDate.setUTCDate(currentDate.getUTCDate() + 1);
    }

    return dates;
  }

  #findCompanyForJob(job) {
    const activity = this.#activities.get(job.id);
    let activityDays = this.#getDates(activity.start, activity.end);

    if (this.#config.excludeWeekends) {
      activityDays = activityDays.filter(
        (d) => 0 < new Date(d).getUTCDate() < 6
      );
    }

    if (this.#config.excludedWorkDates.length) {
      activityDays = activityDays.filter(
        (d) => !this.#config.excludedWorkDates.includes(d)
      );
    }

    const totalCapacity = activityDays.length * activity.capacity;

    const companyIds = [];
    for (let [id, company] of this.#companies.entries()) {
      // check requeued certifications
      if (
        this.#config.considerCertifications &&
        activity.certifications.length
      ) {
        if (
          !activity.certifications.every((c) =>
            company.certifications.includes(c)
          )
        ) {
          continue;
        }
      }
      // check requeued skills
      if (this.#config.considerSkills && activity.skills.length) {
        if (!activity.skills.every((s) => company.skills.includes(s))) {
          continue;
        }
      }
      // check requeued scopes
      if (
        this.#config.considerScopes &&
        activity.scope &&
        !company.scopes.includes('any')
      ) {
        if (!company.scopes.includes(activity.scope)) {
          continue;
        }
      }
      // check requeued capacity
      let companySubCapacity = 0;
      for (let workDate of activityDays) {
        companySubCapacity += company.capacities.has(workDate)
          ? company.capacities.get(workDate)
          : 0;
      }

      if (
        companySubCapacity + this.#config.permissibleCapacityDiscrepancy >
        totalCapacity
      ) {
        companyIds.push(id);
      }
    }

    return {companyIds, totalCapacity};
  }

  constructor(config = {}) {
    this.#config = {
      ...this.#config,
      ...config,
    };
  }

  get config() {
    return this.#config;
  }

  feedProgramPlan(programPlan) {
    this.#programId = programPlan.programId ? programPlan.programId : null;
    this.#customerId = programPlan.customerId ? programPlan.customerId : null;
    if (!this.#programId) {
      throw Error('programId is missed');
    }
    if (!this.#customerId) {
      throw Error('customerId is missed');
    }

    const siteIds = new Set();
    const projectIds = new Set();
    const activityIds = new Set();

    // Initiate program sites
    for (let site of programPlan.sites) {
      if (siteIds.has(site.siteId)) {
        throw Error('Sites duplication. Site id must be unique for the sites.');
      } else {
        siteIds.add(site.siteId);

        let hasLocation = Boolean(site.latitude && site.longitude);
        this.#sites.set(site.siteId, {
          lat: hasLocation ? site.latitude : null,
          long: hasLocation ? site.longitude : null,
        });
      }
    }

    // Initiate program projects
    for (let project of programPlan.projects) {
      if (projectIds.has(project.projectId)) {
        throw Error(
          'Project duplication. Project id must be unique for the projects.'
        );
      } else {
        projectIds.add(project.projectId);

        if (!siteIds.has(project.siteId)) {
          throw Error(
            `consistency issue. Project: ${project.projectId} with invalid site id: ${project.siteId}`
          );
        }

        this.#projects.set(project.projectId, {siteId: project.siteId});
      }
    }

    // Initiate program activities
    const normalPriority = [];
    const importantPriority = [];
    const highPriority = [];

    const setPriority = (priority) => {
      return Number.isInteger(priority) && 0 < priority < 4 ? priority : 1;
    };

    const setCapacity = (capacity) => {
      return Number.isInteger(capacity) && 0 < capacity < 4 ? capacity : 1;
    };

    const compareDates = (dA, dB) =>
      new Date(dA.start).getTime() - new Date(dB.start).getTime();

    for (let activity of programPlan.activities) {
      if (activityIds.has(activity.activityId)) {
        throw Error(
          'Activity duplication. Activity id must be unique for the activities.'
        );
      } else {
        activityIds.add(activity.activityId);

        if (!siteIds.has(activity.siteId)) {
          throw Error(
            `Consistency issue. Activity: ${activity.activityId} with invalid site id: ${activity.siteId}`
          );
        }

        if (!projectIds.has(activity.projectId)) {
          throw Error(
            `Consistency issue. Activity: ${activity.activityId} with invalid project id: ${activity.projectId}`
          );
        }

        let priority = setPriority(activity.priority);
        let capacity = setCapacity(activity.capacity);
        let start = this.#setDate(activity.activityStartDate);

        let act = {
          id: activity.activityId,
          start,
        };

        switch (priority) {
          case 3:
            highPriority.push(act);
            break;
          case 2:
            importantPriority.push(act);
            break;
          default:
            normalPriority.push(act);
        }

        this.#activities.set(activity.activityId, {
          siteId: activity.siteId,
          projectId: activity.projectId,
          scope: activity.scope ? activity.scope : null,
          certifications: this.#setList(activity.certifications),
          skills: this.#setList(activity.skills),
          capacity,
          priority,
          start,
          end: this.#setDate(activity.activityEndDate),
        });

        this.#requiredCapacity += capacity;
      }
    }

    this.#orderedActivities = [
      ...highPriority.sort((a, b) => compareDates(a, b)),
      ...importantPriority.sort((a, b) => compareDates(a, b)),
      ...normalPriority.sort((a, b) => compareDates(a, b)),
    ];
    // console.log(JSON.stringify([...this.#activities.entries()], null, 4));
    // console.log(JSON.stringify(this.#orderedActivities, null, 4));
  }

  feeCrewsCapacities(capacityInfo) {
    this.#capacityInfoId = capacityInfo.capacityInfoId
      ? capacityInfo.capacityInfoId
      : null;
    this.#capacityCreatedAt = capacityInfo.createdAt
      ? capacityInfo.createdAt
      : null;

    if (!this.#capacityCreatedAt) {
      throw Error('capacityInfoId is missed');
    }
    if (!this.#customerId) {
      throw Error('Capacity createdAt is missed');
    }

    const companyIds = new Set();

    const setCompanyScopes = (allocation) => {
      return allocation.scopes &&
        Array.isArray(allocation.scopes) &&
        allocation.scopes.length
        ? allocation.scopes
        : ['any'];
    };

    const setCompanyActivitiesPercentage = (allocation) => {
      return Number.isInteger(allocation.activitiesPercentage) &&
        0 < allocation.activitiesPercentage < 101
        ? allocation.activitiesPercentage
        : 100;
    };

    const setCapacity = (capacity) => {
      return Number(capacity) === capacity && capacity > 0 ? capacity : 0;
    };

    // Initiate companies
    for (let company of capacityInfo.companies) {
      let hasLocation = false;
      let companyCapacity = new Map();
      let companySkills = [];
      let companyCertifications = [];

      if (companyIds.has(company.companyId)) {
        throw Error(
          'Company duplication. Company id must be unique fro the companies.'
        );
      } else {
        companyIds.add(company.companyId);

        const allocation = capacityInfo.allocations.find(
          (a) => a.companyId === company.companyId
        );
        if (!allocation) {
          throw Error(
            `Allocation for the company ${company.companyId} was not provided.`
          );
        }

        if (allocation.programId !== this.#programId) {
          throw Error('Capacity Info does not match feeded program.');
        }

        // Initiate crews
        let companyCrews = new Map();
        let crewCapacity = new Map();
        let crewSkills = [];
        let crewCertifications = [];

        for (let crew of capacityInfo.crews) {
          if (crew.companyId === company.companyId) {
            if (!crew.crewId) {
              throw Error('Some crew is missed crewId');
            }

            hasLocation = Boolean(crew.latitude && crew.longitude);

            for (let cap of capacityInfo.capacities) {
              if (
                cap.companyId === company.companyId &&
                cap.crewId === crew.crewId
              ) {
                let {workDate, capacity} = cap;
                workDate = this.#setDate(workDate);
                capacity = setCapacity(capacity);

                this.#providedCapacity += capacity;

                if (crewCapacity.has(workDate)) {
                  crewCapacity.set(
                    workDate,
                    crewCapacity.get(workDate) + capacity
                  );
                } else {
                  crewCapacity.set(workDate, capacity);
                }

                if (companyCapacity.has(workDate)) {
                  companyCapacity.set(
                    workDate,
                    companyCapacity.get(workDate) + capacity
                  );
                } else {
                  companyCapacity.set(workDate, capacity);
                }
              }
            }

            crewSkills = this.#setList(crew.skills);
            crewCertifications = this.#setList(crew.certifications);

            companySkills.push(...crewSkills);
            companyCertifications.push(...crewCertifications);

            companyCrews.set(crew.crewId, {
              certifications: crewCertifications,
              skills: crewSkills,
              lat: hasLocation ? crew.latitude : null,
              long: hasLocation ? crew.longitude : null,
              capacity: crewCapacity,
            });
          }
        }

        hasLocation = Boolean(company.latitude && company.longitude);
        this.#companies.set(company.companyId, {
          lat: hasLocation ? company.latitude : null,
          long: hasLocation ? company.longitude : null,
          scopes: setCompanyScopes(allocation),
          skills: companySkills,
          certifications: companyCertifications,
          activitiesPercentage: setCompanyActivitiesPercentage(allocation),
          crews: companyCrews,
          capacities: companyCapacity,
          allocated: 0,
        });
      }
    }
  }

  get recommendation() {
    for (let job of this.#orderedActivities) {
      const {companyIds, totalCapacity} = this.#findCompanyForJob(job);
      console.log({companyIds, totalCapacity});
    }
  }

  // logCompanyCrews(companyId) {
  //   const company = this.#companies.get(companyId);
  //   console.log(JSON.stringify([...company.crews.entries()], null, 4));
  // }

  // logCompanyCapacities(companyId) {
  //   const company = this.#companies.get(companyId);
  //   console.log(JSON.stringify([...company.capacities.entries()], null, 4));
  // }
}
