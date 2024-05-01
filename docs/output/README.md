# Input payload schema

## Recommendations

```json
{
  "recommendationId": "01ab23fd-afc2-499b-8256-d77176038670", // uuid not null
  "capacityInfoId": "de0cc934-de40-490f-be5c-7cd5c2f0bcb1", // string uuid not null
  "programId": "8368b651-47ed-4112-83da-2b68b7229663", // string uuid not null
  "createdAt": "2011-10-05T14:48:00.000Z", // string ISO 8601
  "excludeWeekends": true, // boolean not null
  "excludedWorkDates": ["2024-01-01", "2024-01-05"], // list of strings
  "permissibleCapacityDiscrepancy": 1, // int not null
  "crewRecommended": true, // boolean not null
  "considerScopes": true, // boolean not null
  "considerCertifications": true, // boolean not null
  "considerSkills": true, // boolean not null
  "recommendations": [
    {
      "siteId": "e2c03f2f-20b8-4c0d-b952-dfa39d8f161e", // string uuid not null
      "projectId": "da044ada-a418-47ee-8e46-34fd954ea115", // string uuid not null
      "activityId": "e2218365-5f47-4c0a-8d16-4eab0d98fd28", // string uuid not null
      "companyId": "faf48a9d-5eee-4216-92e9-0256880f4a1a", // string uuid not null
      "crewId": "d1f56c50-945e-45ef-9f9a-47f771558cf5", // string uuid not null
      "startDate": "2024-01-01", // string ISO 8601 not null
      "endDate": "2024-01-05", // string ISO 8601 not null
      "companyTitle": "StaSkilled solutions", // string
      "crewTitle": "Funny team" // string varchar(100)
    }
  ]
}
```
