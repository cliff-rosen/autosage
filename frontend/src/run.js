console.log('hello')

const obj = {
    a: 1,
    b: 2,
    c: 3
}

console.log(obj['a'])
const x = obj.find((v) => v.name === 'a')
console.log(x)
