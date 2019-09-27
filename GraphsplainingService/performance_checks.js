const performanceChecks = [
  {
    name: 'No CartesianProduct',
    description: 'Cartesian products should be avoided in general, though less problematic if the leaves coming in are very specific (one or two rows)',
    severity: 5,
    violationCheck: `// this Cypher snippet is appended to a MATCH that has statement, explain, and lastPlan as aliases
      MATCH (lastPlan)-[:HAS_CHILD*]->(cp {operatorType: 'CartesianProduct'})
      OPTIONAL MATCH (cp)-[:HAS_CHILD*]->(uniq {operatorType: 'NodeUniqueIndexSeek'})
      WITH explain, cp, count(uniq) as uniqCount
      MATCH (check:PerformanceCheck {name: $checkName})
      WITH explain, check, cp, check.severity - (uniqCount * 2) AS severity
      MERGE (explain)-[:VIOLATES {severity: severity}]->(check)
      MERGE (check)-[:AT_PLAN]->(cp)`,
  },
  {
    name: 'No EAGER with PERIODIC COMMIT',
    description: 'Any of the EAGER plans will prevent using periodic commit from working. Severity dependant on the size of the file',
    severity: 4,
    violationCheck: `// this Cypher snippet is appended to a MATCH that has statement, explain, and lastPlan as aliases
      WHERE toLower(statement.text) CONTAINS 'using periodic commit'
      WITH statement, explain, lastPlan, [
        'NodeLeftOuterHashJoin',
        'NodeRightOuterHashJoin',
        'NodeHashJoin',
        'EagerAggregation',
        'Eager',
        'Distinct',
        'Sort',
        'Top',
        'ValueHashJoin'
      ] AS eagerPlans
      MATCH (lastPlan)-[:HAS_CHILD*]->(ep)
      WHERE ep.operatorType IN eagerPlans
      MATCH (check:PerformanceCheck {name: $checkName})
      MERGE (explain)-[:VIOLATES {severity: check.severity}]->(check)
      MERGE (check)-[:AT_PLAN]->(ep)`,
  },
];

module.exports = performanceChecks;
