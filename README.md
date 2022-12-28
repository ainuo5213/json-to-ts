### setup

```shell
yarn add @ainuo-utils/json-to-ts

or

npm install @ainuo-utils/json-to-ts
```

### usage

```javascript
import json2ts from '@ainuo5213-utils/json-to-ts';
const data = [
  {
    name: 'ainuo5213',
    age: 24,
    address: {
      country: 'china',
      province: 'sichuan',
      city: 'chengdu'
    },
    favorites: [
      {
        name: 'ping pang',
        score: 97
      }
    ]
  }
];

json2ts(data);
```
