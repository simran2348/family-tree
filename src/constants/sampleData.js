import { createPerson } from '../utils/person';
import { uid } from '../utils/id';

// A four-generation demo family including an adoption, a divorce and a second marriage.
export function createSampleTree() {
  let t = 0;
  const stamp = () => new Date(Date.UTC(2024, 0, 1, 0, 0, t++)).toISOString();
  const people = {};
  const add = (key, fields) => {
    const p = createPerson({ ...fields, id: `p_${key}`, createdAt: stamp(), updatedAt: stamp() });
    people[p.id] = p;
    return p.id;
  };
  const relationships = [];
  const parent = (parentId, childId, subtype = 'biological') =>
    relationships.push({ id: uid('r'), type: 'parent', source: parentId, target: childId, subtype });
  const partner = (a, b, status = 'married', startDate = '', endDate = '') =>
    relationships.push({ id: uid('r'), type: 'partner', source: a, target: b, status, startDate, endDate });

  const arthur = add('arthur', {
    firstName: 'Arthur', middleName: 'James', lastName: 'Hartley', gender: 'male',
    birthDate: '1918-04-12', deathDate: '1994-11-03', isLiving: false, birthPlace: 'York, England',
    location: 'York, England', nationality: 'British', occupation: 'Master carpenter', relationshipStatus: 'married',
    shortBio: 'Carpenter who built half the furniture in the family.',
    lifeStory: 'Arthur apprenticed at fourteen in his uncle’s joinery and later ran the workshop on Gillygate for forty years.',
    events: [{ id: uid('ev'), date: '1939-09', title: 'Joined the Royal Engineers', description: 'Served in North Africa and Italy.' }],
  });
  const margaret = add('margaret', {
    firstName: 'Margaret', lastName: 'Hartley', birthSurname: 'Ellis', gender: 'female',
    birthDate: '1921-08-30', deathDate: '2008-02-14', isLiving: false, birthPlace: 'Leeds, England',
    location: 'York, England', nationality: 'British', occupation: 'Schoolteacher', relationshipStatus: 'widowed',
    shortBio: 'Taught at St Olave’s primary school for 31 years.',
  });
  const henry = add('henry', {
    firstName: 'Henry', lastName: 'Collins', gender: 'male', birthDate: '1920-02-02', deathDate: '1989-06-21',
    isLiving: false, birthPlace: 'Bristol, England', location: 'Bath, England', occupation: 'Railway signalman', relationshipStatus: 'married',
  });
  const dorothy = add('dorothy', {
    firstName: 'Dorothy', lastName: 'Collins', birthSurname: 'Price', gender: 'female', birthDate: '1924-12-09',
    deathDate: '2015-03-17', isLiving: false, birthPlace: 'Cardiff, Wales', location: 'Bath, England', occupation: 'Seamstress',
  });
  const william = add('william', {
    firstName: 'William', middleName: 'Arthur', lastName: 'Hartley', gender: 'male', birthDate: '1946-07-19',
    birthPlace: 'York, England', location: 'Harrogate, England', occupation: 'Civil engineer', relationshipStatus: 'married',
    education: 'University of Leeds, BEng', shortBio: 'Designed bridges across Yorkshire.',
  });
  const eleanor = add('eleanor', {
    firstName: 'Eleanor', lastName: 'Hartley', birthSurname: 'Collins', gender: 'female', birthDate: '1949-11-25',
    birthPlace: 'Bath, England', location: 'Harrogate, England', occupation: 'Librarian', relationshipStatus: 'married',
  });
  const catherine = add('catherine', {
    firstName: 'Catherine', lastName: 'Porter', birthSurname: 'Hartley', gender: 'female', birthDate: '1950-03-04',
    birthPlace: 'York, England', location: 'Edinburgh, Scotland', occupation: 'Botanist', relationshipStatus: 'married',
  });
  const james = add('james', {
    firstName: 'James', lastName: 'Porter', gender: 'male', birthDate: '1948-09-15', deathDate: '2019-01-08',
    isLiving: false, birthPlace: 'Glasgow, Scotland', location: 'Edinburgh, Scotland', occupation: 'Architect',
  });
  const robert = add('robert', {
    firstName: 'Robert', lastName: 'Collins', gender: 'male', birthDate: '1952-05-30', birthPlace: 'Bath, England',
    location: 'Cornwall, England', occupation: 'Fisherman', relationshipStatus: 'married',
  });
  const anne = add('anne', {
    firstName: 'Anne', lastName: 'Fisher', gender: 'female', birthDate: '1954-01-11', birthPlace: 'Exeter, England',
    location: 'Exeter, England', relationshipStatus: 'divorced',
  });
  const maria = add('maria', {
    firstName: 'Maria', lastName: 'Collins', birthSurname: 'Santos', gender: 'female', birthDate: '1958-10-02',
    birthPlace: 'Porto, Portugal', location: 'Cornwall, England', nationality: 'Portuguese', occupation: 'Chef',
  });
  const thomas = add('thomas', {
    firstName: 'Thomas', lastName: 'Hartley', gender: 'male', birthDate: '1975-06-08', birthPlace: 'Harrogate, England',
    location: 'London, England', occupation: 'Software developer', relationshipStatus: 'married',
    education: 'University of Manchester', shortBio: 'Keeper of the family archive.',
    lifeStory: 'Thomas started this tree after finding a box of letters in his grandmother’s attic.',
  });
  const sarah = add('sarah', {
    firstName: 'Sarah', lastName: 'Hartley', birthSurname: 'Bennett', gender: 'female', birthDate: '1977-02-21',
    birthPlace: 'Oxford, England', location: 'London, England', occupation: 'Doctor', relationshipStatus: 'married',
  });
  const emily = add('emily', {
    firstName: 'Emily', lastName: 'Reyes', birthSurname: 'Hartley', gender: 'female', birthDate: '1979-12-14',
    birthPlace: 'Harrogate, England', location: 'Madrid, Spain', occupation: 'Translator', relationshipStatus: 'married',
  });
  const daniel = add('daniel', {
    firstName: 'Daniel', lastName: 'Reyes', gender: 'male', birthDate: '1978-04-03', birthPlace: 'Seville, Spain',
    location: 'Madrid, Spain', nationality: 'Spanish', occupation: 'Photographer',
  });
  const lucy = add('lucy', {
    firstName: 'Lucy', lastName: 'Porter', gender: 'female', birthDate: '1976-08-22', birthPlace: 'Edinburgh, Scotland',
    location: 'Edinburgh, Scotland', occupation: 'Veterinarian', relationshipStatus: 'single',
  });
  const oliver = add('oliver', {
    firstName: 'Oliver', lastName: 'Hartley', gender: 'male', birthDate: '2005-09-30', birthPlace: 'London, England', location: 'London, England',
  });
  const charlotte = add('charlotte', {
    firstName: 'Charlotte', lastName: 'Hartley', gender: 'female', birthDate: '2008-11-11', birthPlace: 'London, England', location: 'London, England',
  });
  const mateo = add('mateo', {
    firstName: 'Mateo', lastName: 'Reyes', gender: 'male', birthDate: '2010-05-05', birthPlace: 'Madrid, Spain', location: 'Madrid, Spain',
  });
  const grace = add('grace', {
    firstName: 'Grace', lastName: 'Porter', gender: 'female', birthDate: '2012-03-19', birthPlace: 'Edinburgh, Scotland', location: 'Edinburgh, Scotland',
  });

  partner(arthur, margaret, 'married', '1944-06-17');
  partner(henry, dorothy, 'married', '1947-04-26');
  [william, catherine].forEach((c) => { parent(arthur, c); parent(margaret, c); });
  [eleanor, robert].forEach((c) => { parent(henry, c); parent(dorothy, c); });
  partner(william, eleanor, 'married', '1973-09-08');
  partner(catherine, james, 'married', '1974-05-18');
  partner(robert, anne, 'divorced', '1976-07-10', '1984-02-01');
  partner(robert, maria, 'married', '1988-11-19');
  [thomas, emily].forEach((c) => { parent(william, c); parent(eleanor, c); });
  parent(catherine, lucy); parent(james, lucy);
  partner(thomas, sarah, 'married', '2003-11-15');
  partner(emily, daniel, 'married', '2007-06-23');
  [oliver, charlotte].forEach((c) => { parent(thomas, c); parent(sarah, c); });
  parent(emily, mateo); parent(daniel, mateo);
  parent(lucy, grace, 'adoptive');

  const now = new Date().toISOString();
  return {
    id: uid('tree'),
    name: 'The Hartley Family',
    description: 'Sample family tree',
    createdAt: now,
    updatedAt: now,
    homePersonId: thomas,
    people,
    relationships,
    positions: {},
    layoutMode: 'auto', // auto | manual
    layoutPreset: 'vertical',
    collapsed: [],
  };
}

export function createEmptyTree(name = 'Untitled tree') {
  const now = new Date().toISOString();
  return {
    id: uid('tree'), name, description: '', createdAt: now, updatedAt: now, homePersonId: null,
    people: {}, relationships: [], positions: {}, layoutMode: 'auto', layoutPreset: 'vertical', collapsed: [],
  };
}
