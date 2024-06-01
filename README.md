# gantt-tetris-demo

Supplier capacity allocation according to the project plan

## Data presentation

- Program Plan [./src/index.html]
- Recommendation for activities [./src/result]

## Set up

```
npm i
```

## Create new mock data set

```
node ./src/mock/Generator.mjs
```

## Render presentation on the new data set

```
node ./src/index.mjs
```

## Create Excels files

Using `mockProgramPlan.json`

```
node ./src/programExcel.mjs
```

Using `mockCapacityInfo.json`

```
node ./src/capacityExcel.mjs
```
