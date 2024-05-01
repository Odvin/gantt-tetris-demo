# Input payload schema

## Program plan

```json
{
  "programId": "8368b651-47ed-4112-83da-2b68b7229663", // string uuid not null
  "programTitle": "Test case validation", // string varchar(50)
  "programStartDate": "2024-01-01", // string ISO 8601
  "programEndDate": "2024-05-20", // string ISO 8601
  "customerId": "6f413f46-b87d-4dea-82ac-0211acb33f1a", // string uuid not null
  "customerTitle": "Palantir", // string varchar(30)
  "sites": [
    {
      "siteId": "e2c03f2f-20b8-4c0d-b952-dfa39d8f161e", // string uuid not null
      "siteTitle": "s-ng-001x-Cols", // string varchar(50)
      "countryCode": "US", // string char(2) ISO 3166 A-2
      "state": "Florida", // string varchar(30)
      "city": "Tallahassee", // string varchar(50)
      "address": "222 S Copeland St, Tallahassee, FL 32304", // string varchar(150)
      "latitude": 30.437664916,
      "longitude": -84.288165514
    }
  ],
  "projects": [
    {
      "projectId": "da044ada-a418-47ee-8e46-34fd954ea115", // string uuid not null
      "siteId": "e2c03f2f-20b8-4c0d-b952-dfa39d8f161e", // string uuid not null
      "projectTitle": "pr-xa-001-Gen", // string varchar(50)
      "projectStarDate": "2024-01-01", // string ISO 8601
      "projectEndDate": "2024-01-30" // string ISO 8601
    }
  ],
  "activities": [
    {
      "activityId": "e2218365-5f47-4c0a-8d16-4eab0d98fd28", // string uuid not null
      "projectId": "da044ada-a418-47ee-8e46-34fd954ea115", // string uuid not null
      "siteId": "e2c03f2f-20b8-4c0d-b952-dfa39d8f161e", // string uuid not null
      "scope": "tuning", // string varchar(30)
      "certifications": ["c-001", "c-002"], // required certifications (list of the certifications ids)
      "skills": ["s-001", "s-002"], // required skills (list of the skills ids)
      "priority": 1, // int [1;3] -> {"normal", "important", "high-priority"} def=1
      "capacity": 1, // int [1;3] -> {"normal", "complex", "complicated"} def=1
      "activityStartDate": "2024-01-01", // string ISO 8601 not null
      "activityEndDate": "2024-01-01" // string ISO 8601 not null
    }
  ]
}
```

## Capacity info

```json
{
  "capacityInfoId": "de0cc934-de40-490f-be5c-7cd5c2f0bcb1", // string uuid not null
  "createdAt": "2011-10-05T14:48:00.000Z", // string ISO 8601
  "companies": [
    {
      "companyId": "faf48a9d-5eee-4216-92e9-0256880f4a1a", // string uuid not null
      "companyTitle": "StaSkilled solutions", // string
      "rating": 12, // int [0;100]
      "countryCode": "US", // string char(2) ISO 3166 A-2
      "state": "Florida", // string varchar(30)
      "city": "Tallahassee", // string varchar(50)
      "address": "222 S Copeland St, Tallahassee, FL 32304", // string varchar(150)
      "latitude": 30.437664916, // float
      "longitude": -84.288165514 // float
    }
  ],
  "crews": [
    {
      "companyId": "faf48a9d-5eee-4216-92e9-0256880f4a1a", // string uuid not null
      "crewId": "d1f56c50-945e-45ef-9f9a-47f771558cf5", // string uuid not null
      "crewTitle": "Funny team", // string varchar(100)
      "countryCode": "US", // string char(2) ISO 3166 A-2
      "state": "Florida", // string varchar(30)
      "city": "Tallahassee", // string varchar(50)
      "contactPhone": "+14155552671", // string varchar(20) E.164
      "latitude": 30.437664916, // float
      "longitude": -84.288165514 // float
    }
  ],
  "allocations": [
    {
      "programId": "8368b651-47ed-4112-83da-2b68b7229663", // string uuid not null
      "companyId": "faf48a9d-5eee-4216-92e9-0256880f4a1a", // string uuid not null
      "scopes": ["any"], // "any" if all scopes a available
      "activitiesPercentage": 60 // [1, 100] possible max % of all activities to allocate
    }
  ],
  "capacities": [
    {
      "companyId": "faf48a9d-5eee-4216-92e9-0256880f4a1a", // string uuid not null
      "crewId": "d1f56c50-945e-45ef-9f9a-47f771558cf5", // string uuid not null
      "workDate": "2024-01-01", // string ISO 8601 not null
      "capacity": 1, // float [0,1;1] 1 - for the complete work day
      "certifications": ["c-001", "c-002"], // crew members certifications (list of the ids)
      "skills": ["s-001", "s-002"] // crew members skills (list of the ids)
    }
  ]
}
```

## Configuration

```json
{
  "excludeWeekends": true,
  "excludedWorkDates": ["2024-01-01", "2024-01-05"],
  "permissibleCapacityDiscrepancy": 1,
  "crewRecommended": true, // if false then the company will be recommended
  "considerScopes": true, // if false then does not care about scopes
  "considerCertifications": true, // if false then does not care about certifications
  "considerSkills": true // if false then does not care about skills
}
```
