export default class Recommender {
  static version = '1.0.0';

  #config = {
    excludeWeekends: true,
    excludedWorkDates: [],
    permissibleCapacityDiscrepancy: 1,
    crewRecommended: true,
    considerCrewLocation: true,
    considerScopes: true,
    considerCertifications: true,
    considerSkills: true,
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

  #getDistance(lat1, lon1, lat2, lon2, unit = 'M') {
    if (lat1 == lat2 && lon1 == lon2) {
      return 0;
    } else {
      const radLat1 = (Math.PI * lat1) / 180;
      const radLat2 = (Math.PI * lat2) / 180;
      const theta = lon1 - lon2;
      const radTheta = (Math.PI * theta) / 180;
      let dist =
        Math.sin(radLat1) * Math.sin(radLat2) +
        Math.cos(radLat1) * Math.cos(radLat2) * Math.cos(radTheta);

      if (dist > 1) {
        dist = 1;
      }

      dist = Math.acos(dist);
      dist = (dist * 180) / Math.PI;
      dist = dist * 60 * 1.1515;

      if (unit == 'K') {
        dist = dist * 1.609344;
      }

      if (unit == 'N') {
        dist = dist * 0.8684;
      }

      return dist;
    }
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

    return {
      companyIds,
      jobInfo: {
        activityCapacity: activity.capacity,
        activityDays,
        totalCapacity,
        activityId: job.id,
      },
    };
  }

  #allocateCompanyForJob(companyIds) {
    const remainders = companyIds.map(
      (c) =>
        (this.#requiredCapacity * this.#companies.get(c).activitiesPercentage) /
          100 -
        this.#companies.get(c).allocated
    );

    const maxRemainder = Math.max(...remainders);

    return companyIds[remainders.indexOf(maxRemainder)];
  }

  #allocateCrewsForJob(allocatedCompanyId, jobInfo) {
    const activity = this.#activities.get(jobInfo.activityId);
    const company = this.#companies.get(allocatedCompanyId);

    const crewsCapacity = [];

    for (let [id, crew] of company.crews.entries()) {
      // check requeued certifications
      if (
        this.#config.considerCertifications &&
        activity.certifications.length
      ) {
        if (
          !activity.certifications.every((c) => crew.certifications.includes(c))
        ) {
          continue;
        }
      }
      // check requeued skills
      if (this.#config.considerSkills && activity.skills.length) {
        if (!activity.skills.every((s) => crew.skills.includes(s))) {
          continue;
        }
      }
      // check requeued capacity
      let crewSubCapacity = 0;
      for (let workDate of jobInfo.activityDays) {
        crewSubCapacity += crew.capacity.has(workDate)
          ? crew.capacity.get(workDate)
          : 0;
      }

      // check distance from site to the crew
      let crewToSiteDistance = Infinity;
      if (this.#config.considerCrewLocation) {
        if (this.#sites.get(activity.siteId).lat) {
          const siteLat = this.#sites.get(activity.siteId).lat;
          const siteLong = this.#sites.get(activity.siteId).long;

          if (crew.lat) {
            crewToSiteDistance = this.#getDistance(
              siteLat,
              siteLong,
              crew.lat,
              crew.long
            );
          }
        }
      }

      crewsCapacity.push({
        crewId: id,
        capacity: crewSubCapacity,
        distance: crewToSiteDistance,
      });
    }

    crewsCapacity.sort((c1, c2) => c1.distance - c2.distance);

    if (crewsCapacity.every((c) => c.distance === Infinity)) {
      crewsCapacity.sort((c1, c2) => c2.capacity - c1.capacity);
    }

    const selectedCrewIds = [];
    let collectedCrewCapacity = 0;
    for (let selectedCrew of crewsCapacity) {
      selectedCrewIds.push(selectedCrew.crewId);
      collectedCrewCapacity += selectedCrew.capacity;

      if (
        collectedCrewCapacity + this.#config.permissibleCapacityDiscrepancy >
        jobInfo.totalCapacity
      ) {
        break;
      }
    }
    return selectedCrewIds;
  }

  #getCrewsRecommendations(allocatedCompanyId, allocatedCrewIds, jobInfo) {
    const crews = this.#companies.get(allocatedCompanyId).crews;
    const capacities = this.#companies.get(allocatedCompanyId).capacities;

    let reqCapacity = jobInfo.totalCapacity;
    let recommendations = allocatedCrewIds.map((c) => ({
      activityId: jobInfo.activityId,
      companyId: allocatedCompanyId,
      crewId: c,
      startDate: null,
      endDate: null,
    }));

    for (let workDate of jobInfo.activityDays) {
      for (let crewId of allocatedCrewIds) {
        let crewCapacity = crews.get(crewId).capacity;
        const crewDailyCapacity = crewCapacity.get(workDate);
        if (crewDailyCapacity > 0 && reqCapacity > 0) {
          reqCapacity -= crewDailyCapacity;

          capacities.set(
            workDate,
            capacities.get(workDate) - crewDailyCapacity
          );

          crewCapacity.set(workDate, 0);

          crews.set(crewId, {
            ...crews.get(crewId),
            capacity: crewCapacity,
          });

          recommendations = recommendations.map((r) =>
            r.crewId === crewId && r.companyId === allocatedCompanyId
              ? {
                  ...r,
                  startDate: r.startDate ? r.startDate : workDate,
                  endDate: workDate,
                }
              : r
          ); //
        }
      }

      if (reqCapacity <= 0) break;
    }

    this.#companies.set(allocatedCompanyId, {
      ...this.#companies.get(allocatedCompanyId),
      crews: crews,
      capacities: capacities,
      allocated: jobInfo.totalCapacity,
    });

    return recommendations.filter((r) => Boolean(r.startDate && r.endDate));
  }

  #getCompaniesRecommendations(allocatedCompanyId, jobInfo) {
    const capacities = this.#companies.get(allocatedCompanyId).capacities;
    let recommendation = {
      activityId: jobInfo.activityId,
      companyId: allocatedCompanyId,
      crewId: allocatedCompanyId,
    };

    let reqCapacity = jobInfo.totalCapacity;
    for (let workDate of jobInfo.activityDays) {
      const companyDailyCapacity = capacities.get(workDate);
      if (companyDailyCapacity > 0 && reqCapacity > 0) {
        recommendation = {
          ...recommendation,
          startDate: recommendation.startDate
            ? recommendation.startDate
            : workDate,
          endDate: workDate,
        };

        const takeCapacity =
          companyDailyCapacity >= jobInfo.activityCapacity
            ? jobInfo.activityCapacity
            : companyDailyCapacity;

        reqCapacity -= takeCapacity;

        capacities.set(workDate, companyDailyCapacity - takeCapacity);
      }

      if (reqCapacity <= 0) break;
    }

    this.#companies.set(allocatedCompanyId, {
      ...this.#companies.get(allocatedCompanyId),
      capacities: capacities,
      allocated: jobInfo.totalCapacity,
    });

    return recommendation;
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

        let crewSkills = [];
        let crewCertifications = [];

        for (let crew of capacityInfo.crews) {
          if (crew.companyId === company.companyId) {
            if (!crew.crewId) {
              throw Error('Some crew is missed crewId');
            }

            let crewCapacity = new Map();
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
    const result = [];
    for (let job of this.#orderedActivities) {
      const {companyIds, jobInfo} = this.#findCompanyForJob(job);

      const allocatedCompanyId = this.#allocateCompanyForJob(companyIds);
      let allocatedCrewIds = allocatedCompanyId ? [allocatedCompanyId] : [];

      if (this.#config.crewRecommended && allocatedCompanyId) {
        allocatedCrewIds = this.#allocateCrewsForJob(
          allocatedCompanyId,
          jobInfo
        );

        let recommendations = this.#getCrewsRecommendations(
          allocatedCompanyId,
          allocatedCrewIds,
          jobInfo
        );

        recommendations = recommendations.map((r) => ({
          ...r,
          siteId: this.#activities.get(job.id).siteId,
          projectId: this.#activities.get(job.id).projectId,
        }));

        result.push(...recommendations);
      }

      if (!this.#config.crewRecommended && allocatedCompanyId) {
        const recommendation = this.#getCompaniesRecommendations(
          allocatedCompanyId,
          jobInfo
        );

        result.push({
          ...recommendation,
          siteId: this.#activities.get(job.id).siteId,
          projectId: this.#activities.get(job.id).projectId,
        });
      }
    }

    const stats = {
      providedCapacity: this.#providedCapacity,
      allocatedCapacity: 0,
      companyAllocations: [],
    };

    for (let [id, company] of this.#companies.entries()) {
      stats.allocatedCapacity += company.allocated;
      stats.companyAllocations.push({
        companyId: id,
        allocated: company.allocated,
        requestedPercentage: company.activitiesPercentage,
        providedPercentage: Math.floor(
          (company.allocated * 100) / this.#providedCapacity
        ),
      });
    }

    return {result, stats};
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
