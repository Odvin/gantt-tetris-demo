# Input payload schema

## Recommendations

```json
{
  "stats": {
    "providedCapacity": 1109, //integer not null
    "allocatedCapacity": 618, //integer not null
    "companyAllocations": [
      {
        "companyId": "faf48a9d-5eee-4216-92e9-0256880f4a1a", // string uuid not null
        "allocated": 124, //integer not null
        "requestedPercentage": 19, //integer not null
        "providedPercentage": 11 //integer not null
      }
    ]
  },
  "result": [
    {
      "siteId": "e2c03f2f-20b8-4c0d-b952-dfa39d8f161e", // string uuid not null
      "projectId": "da044ada-a418-47ee-8e46-34fd954ea115", // string uuid not null
      "activityId": "e2218365-5f47-4c0a-8d16-4eab0d98fd28", // string uuid not null
      "companyId": "faf48a9d-5eee-4216-92e9-0256880f4a1a", // string uuid not null
      "crewId": "d1f56c50-945e-45ef-9f9a-47f771558cf5", // string uuid not null
      "startDate": "2024-01-01", // string ISO 8601 not null
      "endDate": "2024-01-05" // string ISO 8601 not null
    }
  ]
}
```
