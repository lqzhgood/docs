# 可变与不可变：Zustand 与 Valtio 深度对照

Zustand 和 Valtio 出自同一个组织（pmndrs），作者都是 Daishi Kato，体积都在个位数 KB，都不需要 Provider 就能用。表面上它们是同一类库的两个口味，但真正把它们区分开的只有一件事：

**Zustand 认为状态是不可变的，Valtio 认为状态是可变的。**

---

## 0. 先给结论

如果你只读一段，读这张表。

| 维度             | Zustand                                                    | Valtio                                       |
| ---------------- | ---------------------------------------------------------- | -------------------------------------------- |
| **状态模型**     | 不可变，`set` 产生新对象                                   | 可变，直接赋值原地改                         |
| **变更检测**     | 引用比较（`Object.is`）                                    | Proxy 拦截 + 版本号                          |
| **渲染优化**     | 手动写 selector，默认全量订阅                              | 自动追踪渲染期访问的属性                     |
| **嵌套更新**     | 需逐层展开，或上 immer 中间件                              | `state.a.b.c = 1` 直接改                     |
| **心智负担**     | 集中在"如何正确写 selector"                                | 集中在"守住 action 边界"                     |
| **调试溯源**     | 拿到新旧 state，差异自己算                                 | subscribe 给出变更路径与新旧值               |
| **写入收口**     | 机制性（不走 `set` 就不生效）                              | 约定性（走 actions 是自觉，非强制）          |
| **不可变保证**   | 由约定与 `set` 语义保证                                    | 仅靠 TypeScript `readonly`，**运行时不冻结** |
| **中间件生态**   | 成熟（persist / devtools / immer / subscribeWithSelector） | 较薄，utils 为主                             |
| **典型误用后果** | 无限重渲染（响亮报错）                                     | 该渲染的没渲染（静默失效）                   |

**一句话选型**：需要可预测性、可审计的变更链路、成熟中间件生态，选 Zustand；状态树深、更新频繁琐碎、想省掉 selector 心智，选 Valtio。

> **贯穿全文的一条前提**：下文所有 Valtio 示例都遵循**写入一律走 actions**——组件只 `useSnapshot` 读，所有修改收口到一组导出函数里。这是官方推荐姿势，也是唯一能规模化的姿势，它把"每写一行都要判断 snap 还是 state"降级成"守住 action 边界的两条规则"（见 §4.6）。表格里 Valtio 一侧的"心智负担"与"典型误用后果"，说的都是遵守这条约定之后**仍然剩下**的部分。

---

## 1. 一个分歧决定一切

### 1.1 不可变：靠"换对象"传递变化

Zustand 中状态是一个只读快照。你不能改它，只能生产一个新的替换它。整体思想保持和 React 一致。

```ts
// 旧 state 从未被修改，它只是被抛弃了
setState(prev => ({ count: prev.count + 1 }));
```

这样做的好处是**变化天然可比较**：只要引用变了就是变了，引用没变就一定没变。整个订阅体系可以建立在 `Object.is` 这一个操作上，成本是 O(1)。

代价是**定位变化的粒度全靠人工**。store 换了新对象，但订阅者怎么知道自己关心的那部分变没变？只能靠你写 selector 把它挑出来，再比一次。selector 写得好不好，直接决定渲染性能。

### 1.2 可变：靠"拦截写入"捕获变化

Valtio 的世界里，状态就是一个普通对象，你想改哪儿改哪儿。

```ts
state.count += 1;
state.user.profile.name = 'Ada';
```

变化不需要你告诉框架——Proxy 的 `set` 陷阱会亲眼看见。库因此**精确地知道是哪个路径上的哪个属性变了**，粒度天然细到属性级。

代价是**不可变性消失了**，而 React 又恰恰建立在不可变假设之上。Valtio 必须在读的一侧把可变世界重新翻译回不可变世界——这就是 `snapshot()` 存在的理由，也是 Valtio 全部实现复杂度的来源。

**但这份复杂度不必全部转嫁给使用者。** 把写入收口到 actions 之后，读写分离就成了目录结构上的事实：组件文件里只有 `snap`，actions 文件里只有 `state`，两者不在同一处出现，也就不需要在每一行做判断。剩下要守的只是 action 边界上的传参纪律（§4.6）。

### 1.3 这条分歧的下游

记住下面这个对应关系，后文所有差异都是它的推论：

|                              | Zustand                     | Valtio                      |
| ---------------------------- | --------------------------- | --------------------------- |
| 变化在**写**的时候被捕获吗？ | 否，只知道"整体换了"        | 是，知道"哪条路径变了"      |
| 变化的**定位**成本在哪一侧？ | 读（每个订阅者跑 selector） | 写（Proxy 拦截 + 版本冒泡） |
| 谁负责**缩小渲染范围**？     | 你（写 selector）           | 库（自动依赖追踪）          |
| 写入**收口**靠什么？         | 机制（`set` 是唯一入口）    | 约定（走 actions 是自觉）   |

---

## 2. 基础使用对比

### 2.1 创建 store

<table>
<tr><th>Zustand（不可变）</th><th>Valtio（可变）</th></tr>
<tr><td>

```ts
import { create } from 'zustand';

type State = {
    count: number;
    inc: () => void;
};

export const useCounter = create<State>()(set => ({
    count: 0,
    inc: () => set(s => ({ count: s.count + 1 })),
}));
```

</td><td>

```ts
import { proxy } from 'valtio';

export const counter = proxy({
    count: 0,
});

export const actions = {
    inc: () => {
        counter.count += 1;
    },
};
```

</td></tr>
</table>

**差异根源**：Zustand 的 action 必须通过 `set` 这个唯一入口，因为只有它能替换 state 并通知订阅者。Valtio 的 action 就是普通函数，改完就完事——通知由 Proxy 自动发出。

**注意两边"收口"的性质不同，这是全文反复出现的一条主线**：Zustand 的收口是机制性的（不走 `set` 就不生效），Valtio 的收口是约定性的（任何地方赋值都生效，只是你选择不那么做）。约定的好处是灵活——action 是普通函数，不必挂在 store 上，可以自由拆分文件、互相调用、被非 React 代码直接调；代价是它需要 code review 而非编译器来维持。**把 state 与 actions 放在同一模块并只导出 actions，能把这条约定变得接近机制**：

```ts
// store/counter.ts
import { proxy } from 'valtio';

// 不导出 —— 模块外拿不到可写引用
const state = proxy({ count: 0 });

// 只导出这两样：一个只读入口，一组写入口
export const useCounterSnap = () => useSnapshot(state);
export const actions = {
    inc: () => {
        state.count += 1;
    },
};
```

这样组件侧连 `state` 这个标识符都见不到，误写的可能性从"靠自觉"变成"拿不到对象"。**代价是丧失了 §2.5 那种在任意模块直接读写的便利**，需要为每种跨模块访问补一个具名 action —— 这恰恰是你想要的那种约束。

> Zustand 那个 `create<State>()(...)` 的双重调用不是笔误。TypeScript 无法同时推断 state 类型和中间件类型，curried 写法是官方给出的绕法。带类型时必须这么写，这一点几乎每个新人都会问一次。

### 2.2 在组件中读取

<table>
<tr><th>Zustand</th><th>Valtio</th></tr>
<tr><td>

```tsx
function Count() {
    // 必须手动挑出关心的字段
    const count = useCounter(s => s.count);
    return <span>{count}</span>;
}
```

</td><td>

```tsx
function Count() {
    // 读什么，就自动订阅什么
    const snap = useSnapshot(counter);
    return <span>{snap.count}</span>;
}
```

</td></tr>
</table>

**差异根源**：这是全文最重要的一组对照。Zustand 里不写 selector（`useCounter()`）意味着订阅整个 store，任何字段变化都会重渲染；Valtio 里 `useSnapshot` 返回的是一个带追踪能力的代理，你在渲染中碰过哪些属性，它就只订阅哪些属性。

**默认值的方向是相反的**：Zustand 默认过度渲染，需要你手动收窄；Valtio 默认精确渲染，需要你避免意外扩大。

而"避免意外扩大"基本等价于一条可执行的规则：**snap 只出现在渲染路径上**（JSX、渲染期计算、传给子组件的 props），不进事件回调、不进 effect、不作为参数交给 action。这也正是走 actions 之后剩下的主要纪律（§4.6）。

### 2.3 写入与嵌套更新

<table>
<tr><th>Zustand</th><th>Valtio</th></tr>
<tr><td>

```ts
// 顶层：浅合并，只需给出变化部分
set({ theme: 'dark' });

// 嵌套：必须逐层展开
set(s => ({
    user: {
        ...s.user,
        profile: {
            ...s.user.profile,
            name: 'Ada',
        },
    },
}));

// 数组：造新数组
set(s => ({
    todos: [...s.todos, todo],
}));
```

</td><td>

```ts
// 顶层
state.theme = 'dark';

// 嵌套：直接改，层级再深也一样
state.user.profile.name = 'Ada';

// 数组：原生方法即可
state.todos.push(todo);
```

</td></tr>
</table>

**差异根源**：这是 Valtio 最直观的胜场。Zustand 的浅合并只作用于第一层，往下每一层都要你自己手动展开复制，层级越深样板代码越多，而且**漏掉一层就是静默的数据丢失**（见 §4.2）。Valtio 因为是原地修改，深度对它毫无影响。

Zustand 可以用 immer 中间件把这个差距抹平：

```ts
import { immer } from 'zustand/middleware/immer';

const useStore = create<State>()(
    immer(set => ({
        setName: (name: string) =>
            set(s => {
                s.user.profile.name = name; // 写法与 Valtio 一致
            }),
    })),
);
```

但注意这只是把"可变写法"作为语法糖搬了进来——immer 内部依然靠 Proxy 记录草稿再产出新对象，你付出的是额外的包体积和一层封装。**如果你的项目最终要靠 immer 才能写得舒服，这本身就是一个"也许该用 Valtio"的信号。**

### 2.4 派生状态

<table>
<tr><th>Zustand</th><th>Valtio</th></tr>
<tr><td>

```ts
// 在 selector 里算
const doneCount = useTodos(s => s.todos.filter(t => t.done).length);
// 返回原始值，引用比较天然安全
```

</td><td>

```ts
// 用 getter 定义在 proxy 上
const state = proxy({
    todos: [] as Todo[],
    get doneCount() {
        return state.todos.filter(t => t.done).length;
    },
});
```

</td></tr>
</table>

**差异根源**：Zustand 的派生逻辑天然属于读侧，每个订阅者各算各的；好处是简单，坏处是同一份计算会在多个组件里重复执行，重计算要自己上 memo。Valtio 的 getter 属于状态定义本身，全局只有一处，但它**不做缓存**——每次生成快照都会重新求值，重计算同样要自己处理。

两边都没有内置的 memoized selector。Zustand 侧通常配 `reselect` 或手写缓存；Valtio 侧的 `derive` 已在 v2 拆成独立包 `derive-valtio`。

### 2.5 组件外读写

<table>
<tr><th>Zustand</th><th>Valtio</th></tr>
<tr><td>

```ts
// 读
const { count } = useCounter.getState();

// 写
useCounter.setState({ count: 10 });

// 订阅
const un = useCounter.subscribe((s, prev) => {
    if (s.count !== prev.count) log(s.count);
});
```

</td><td>

```ts
// 读：就是普通对象
const { count } = counter;

// 写
counter.count = 10;

// 订阅
const un = subscribe(counter, ops => {
    // ops: [['set', ['count'], 10, 0]]
    log(ops);
});
```

</td></tr>
</table>

**差异根源**：注意订阅回调的信息量差异，这在工程上比看起来重要得多。Zustand 给你新旧两个 state，**变化点要自己 diff**；Valtio 直接给出 `[操作类型, 路径, 新值, 旧值]`。做审计日志、精细化持久化、埋点上报时，Valtio 的 op 是现成的，Zustand 需要你补一层 diff 逻辑。

> **上面 Valtio 那栏的"写"只是为了展示 API 能力，不是推荐写法。** 走 actions 的项目里，组件外的写入同样应该是一次 action 调用而不是裸赋值——否则 §5.3 那套"给变更接上名字"的能力就漏了。读则不受限制：`counter.count` 拿到的永远是最新值，这也正是 action 内部读状态的正确方式。

### 2.6 异步

<table>
<tr><th>Zustand</th><th>Valtio</th></tr>
<tr><td>

```ts
fetchUser: async (id: string) => {
    set({ loading: true });
    const user = await api.getUser(id);
    set({ user, loading: false });
};
```

</td><td>

```ts
export const actions = {
    fetchUser: async (id: string) => {
        state.loading = true;
        const user = await api.getUser(id);
        state.user = user;
        state.loading = false;
    },
};
```

</td></tr>
</table>

两边写法几乎同构。但 Valtio 有一处 v2 的重要变化：**v1 会把 store 里的 Promise 自动 unwrap 并配合 Suspense，v2 移除了这个行为**，改为要求你显式使用 React 的 `use` hook。从 v1 升级时这是必查项。

---

## 3. 架构实现剖析

### 3.1 Zustand：一个七十行的发布订阅

Zustand 的 vanilla 核心几乎没有魔法。剥掉类型后，`createStore` 的实质就是下面这些：

```ts
const createStoreImpl = createState => {
    let state;
    const listeners = new Set();

    const setState = (partial, replace) => {
        const nextState =
            typeof partial === 'function' ? partial(state) : partial;

        // ① 引用没变就什么都不做
        if (Object.is(nextState, state)) return;

        const previousState = state;

        // ② replace 未指定时，对象做浅合并；非对象直接替换
        state =
            (replace ?? (typeof nextState !== 'object' || nextState === null))
                ? nextState
                : Object.assign({}, state, nextState);

        // ③ 无差别通知所有订阅者
        listeners.forEach(listener => listener(state, previousState));
    };

    const getState = () => state;
    const getInitialState = () => initialState;
    const subscribe = listener => {
        listeners.add(listener);
        return () => listeners.delete(listener);
    };

    const api = { setState, getState, getInitialState, subscribe };
    const initialState = (state = createState(setState, getState, api));
    return api;
};
```

三个细节值得停下来看：

- **① 的 `Object.is`** 只比较顶层引用。这是不可变模型的全部收益：判断"变没变"是 O(1)。
- **② 的 `Object.assign({}, state, nextState)`** 只合并第一层。这是 §4.2 那个经典 bug 的直接来源。
- **③ 是无差别广播**。store 不知道谁关心什么，所有订阅者都会被叫醒。**过滤的责任完全在读侧。**

再看 React 绑定层，同样朴素：

```ts
export function useStore(api, selector) {
    return React.useSyncExternalStore(
        api.subscribe,
        () => selector(api.getState()),
        () => selector(api.getInitialState()),
    );
}
```

整个渲染优化机制就藏在这三行里。`useSyncExternalStore` 的契约是：每次 store 通知，React 就调用 `getSnapshot()`，把结果与上次的用 `Object.is` 比较，**不同才重渲染**。

于是逻辑链条清晰了：

> store 广播 → 每个订阅组件跑一遍自己的 selector → 结果引用变了才渲染

这解释了两件事。第一，为什么 selector **必须返回稳定引用**——如果它每次都造新对象，`Object.is` 永远为假，组件就会无限重渲染（React 还会警告 `getSnapshot should be cached`）。第二，为什么 Zustand 的更新成本是 **O(订阅者数量)**：每次任意字段变化，页面上所有订阅该 store 的组件都要跑一次 selector。selector 本身很便宜，所以通常无所谓，但如果你在 selector 里做重计算，成本会被订阅者数量放大。

还有一处容易被忽略：`getServerSnapshot` 用的是 `getInitialState()` 而非 `getState()`。这保证了 SSR 期间拿到的是初始状态，是水合一致性的基础——同时也埋下了 §4.3 的模块级 store 陷阱。

> **对选型意味着什么**：Zustand 的实现小到你可以在一次代码评审里读完。没有隐式行为，出问题时栈是直的，团队新人建立准确心智模型的成本极低。代价是渲染优化完全外包给了使用者。

### 3.2 Valtio：Proxy、版本号与快照缓存

Valtio 复杂得多，因为它要同时维护两个世界：可变的 proxy（给你写）和不可变的 snapshot（给 React 读）。

**四张 WeakMap 撑起整个系统：**

| WeakMap         | 作用                                     |
| --------------- | ---------------------------------------- |
| `proxyStateMap` | proxy → 内部状态（target、版本、监听器） |
| `refSet`        | 标记为 `ref()` 的对象，跳过代理          |
| `snapCache`     | target → `[版本号, 快照]`，快照缓存      |
| `proxyCache`    | 原对象 → 已创建的 proxy，防止重复代理    |

**一个全局版本计数器：**

```ts
const versionHolder = [1] as [number];
```

注意它是**全局单调递增**的，不是每个 proxy 独立。任何一次修改都会推进这个全局版本。

**写入路径**：`set` 陷阱做三件事——

```ts
set(target, prop, value, receiver) {
  const prevValue = Reflect.get(target, prop, receiver)
  if (Object.is(prevValue, value)) return true      // ① 值没变，短路

  // ② 子对象自动递归代理，深层结构因此"活"了
  const nextValue =
    !proxyStateMap.has(value) && canProxy(value) ? proxy(value) : value

  Reflect.set(target, prop, nextValue, receiver)
  notifyUpdate(['set', [prop], value, prevValue])   // ③ 带路径通知
  return true
}
```

**变更如何向上冒泡**：每个子 proxy 上都挂了一个父级安插的监听器，它把自己的属性名拼到路径前面再往上传：

```ts
const createPropListener = prop => (op, nextVersion) => {
    const newOp = [...op];
    newOp[1] = [prop, ...newOp[1]]; // 路径前缀累加
    notifyUpdate(newOp, nextVersion);
};

const notifyUpdate = (op, nextVersion = ++versionHolder[0]) => {
    if (version !== nextVersion) {
        version = nextVersion;
        listeners.forEach(listener => listener(op, nextVersion));
    }
};
```

所以改一个 `state.a.b.c`，根节点收到的是 `['set', ['a','b','c'], 新值, 旧值]`，同时从 `c` 到根的每一层版本号都被刷新。**这就是 Valtio 能给出精确变更路径的原因，也是它写入成本正比于嵌套深度的原因。**

**读取路径**：`snapshot()` 把可变树翻译成不可变树，关键在缓存与结构共享：

```ts
const createSnapshot = (target, version) => {
    const cache = snapCache.get(target);
    if (cache?.[0] === version) return cache[1]; // 版本没变，复用旧快照

    const snap = Array.isArray(target)
        ? []
        : Object.create(Object.getPrototypeOf(target));
    markToTrack(snap, true);
    snapCache.set(target, [version, snap]);

    Reflect.ownKeys(target).forEach(key => {
        const value = Reflect.get(target, key);
        const childState = proxyStateMap.get(value);
        snap[key] = childState
            ? createSnapshot(childState[0], childState[1]()) // 递归
            : value; // 原始值/ref 直接搬
    });
    return snap;
};
```

因为版本号是逐层维护的，**没被碰过的子树版本不变，直接命中缓存返回同一个对象引用**——这就是结构共享。改 `state.a.b.c` 之后，`snap.d` 与旧快照的 `d` 是同一个引用，`snap.a.b.c` 才是新的。

**关键事实：快照并不做运行时冻结。** 早期版本用 `Object.freeze` / `Object.preventExtensions` 提供运行时护栏，但为兼容 React Native 的 Hermes 引擎，`Object.preventExtensions` 已在 [PR #1220](https://github.com/pmndrs/valtio/pull/1220) 中移除。**当前版本的"不可变"是类型层面的约定（`Snapshot<T>` 的深度 `readonly`），而不是运行时强制。** 走 actions 的写法基本不会撞上这一点（组件里没有写入语句可写），但它决定了 §4.6 里另一类问题为什么无法被自动拦住。

**批处理**：默认情况下 `subscribe` 不会同步触发，而是把 ops 攒进微任务：

```ts
// 三次修改 → 只通知一次，ops 数组含三条
state.a = 1;
state.b = 2;
state.c = 3;
```

想要同步通知，`subscribe(state, cb, true)` 或 `useSnapshot(state, { sync: true })`。

**渲染优化**：`useSnapshot` 把快照再包一层 proxy-compare 的追踪代理：

```ts
function useSnapshot(proxyObject, options) {
    // affected 记录"渲染期间读过哪些路径"
    const affected = useMemo(() => new WeakMap(), [proxyObject]);
    const lastSnapshot = useRef();

    const currSnapshot = useSyncExternalStore(
        useCallback(
            cb => subscribe(proxyObject, cb, options?.sync),
            [proxyObject, options?.sync],
        ),
        () => {
            const nextSnapshot = snapshot(proxyObject);
            // 只有"读过的那些属性"变了，才认为需要换快照
            if (
                lastSnapshot.current &&
                !isChanged(
                    lastSnapshot.current,
                    nextSnapshot,
                    affected,
                    new WeakMap(),
                )
            ) {
                return lastSnapshot.current; // 骗过 useSyncExternalStore，不渲染
            }
            return nextSnapshot;
        },
        /* getServerSnapshot */
    );
    lastSnapshot.current = currSnapshot;

    // 返回追踪代理：渲染中每次属性访问都记进 affected
    return createProxyToCompare(currSnapshot, affected, undefined, targetCache);
}
```

这就是"自动依赖追踪"的全貌：**渲染时记录读了什么，更新时只比对读过的部分**。你不写 selector，是因为 proxy-compare 替你把 selector 推导出来了。

> **对选型意味着什么**：Valtio 用可观的实现复杂度换来了两样东西——写法上的直觉性，和精确到属性的自动渲染优化。但这套机制是隐式的：它工作得好时你感觉不到它，工作得不对时你也很难看到它。调试依赖追踪问题，需要你真正理解上面这段代码。

### 3.3 成本落在哪一侧

这是全文最核心的一张对照。

|                    | Zustand                        | Valtio                                 |
| ------------------ | ------------------------------ | -------------------------------------- |
| **写入成本**       | O(1)，造个新对象通知一遍       | O(嵌套深度)，Proxy 拦截 + 逐层版本冒泡 |
| **通知成本**       | O(订阅者数)，每个都跑 selector | O(订阅者数)，每个都跑 `isChanged`      |
| **读取成本**       | 直接读，零开销                 | 需生成快照（有缓存与结构共享兜底）     |
| **优化谁负责**     | 你，写 selector                | 库，proxy-compare 自动追踪             |
| **优化失败的表现** | 多渲染（能看见、能 profile）   | 多渲染 **或** 少渲染（少渲染极难查）   |
| **失败的主要来源** | selector 返回新引用            | snap 泄漏出渲染路径 / 渲染期读了 state |

实践中两者在中小型应用里性能差异都不显著，真正的分野在**优化失败的形态**：

- Zustand 写错 selector，最坏是无限重渲染，React 会直接警告，问题响亮且立刻暴露。
- Valtio 的追踪出问题，可能表现为**该更新的地方没更新**。没有报错，没有警告，只有一个不刷新的组件。

走 actions 消不掉这一栏，因为它出在读侧：渲染期不小心读了 `state` 而不是 `snap`，值是对的、订阅没建立，组件就此静默失联。**这是遵守约定之后 Valtio 仍然独有的失败形态，也是它相对 Zustand 最实质的残留风险。**

**对一个需要长期维护、成员流动的团队来说，这个差异往往比性能数字更重要。**

---

## 4. 常见问题与痛点

### Zustand 篇

#### 4.1 选择器返回新对象 → 无限重渲染

这是 Zustand 的头号坑，直接源于 §3.1 那个 `Object.is`。

<table>
<tr><th>❌ 会无限重渲染</th><th>✅ 正确写法</th></tr>
<tr><td>

```ts
// 每次调用都造一个新数组
const [a, b] = useStore(s => [s.a, s.b]);

// 对象同理
const { x, y } = useStore(s => ({
    x: s.x,
    y: s.y,
}));
```

</td><td>

```ts
import { useShallow } from 'zustand/react/shallow';

const [a, b] = useStore(useShallow(s => [s.a, s.b]));

const { x, y } = useStore(useShallow(s => ({ x: s.x, y: s.y })));
```

</td></tr>
</table>

`useShallow` 的实现只有几行，本质是用 ref 缓存上次结果，浅比较相等就把**旧引用**还回去：

```ts
export function useShallow(selector) {
    const prev = React.useRef(undefined);
    return state => {
        const next = selector(state);
        return shallow(prev.current, next)
            ? prev.current
            : (prev.current = next);
    };
}
```

**v4 → v5 的破坏性变更（务必注意）**：v4 支持第三个参数传相等函数：

```ts
// v4 可以，v5 已移除
useStore(selector, shallow);
```

v5 的 `useStore` 只接受 `(api, selector)` 两个参数，第三个参数被彻底删除。升级时这类调用不会报类型错误就悄悄失效的风险很高——**它们会退化成默认的 `Object.is` 比较，从而变成无限重渲染**。全局搜索 `, shallow)` 是升级 v5 的必做项。

另一个等价解法是拆成多个原子 selector，各自返回原始值：

```ts
const a = useStore(s => s.a);
const b = useStore(s => s.b);
```

这样完全不需要 `useShallow`。**多数情况下这是更好的选择**——它更简单，也更难写错。

#### 4.2 浅合并只到第一层 → 静默丢数据

<table>
<tr><th>❌ 丢失 age</th><th>✅ 正确写法</th></tr>
<tr><td>

```ts
// state.user = { name: 'Bob', age: 30 }

set({ user: { name: 'Ada' } });

// 结果：{ name: 'Ada' }
// age 没了，且没有任何报错
```

</td><td>

```ts
set(s => ({
    user: { ...s.user, name: 'Ada' },
}));

// 或用 immer 中间件
set(s => {
    s.user.name = 'Ada';
});
```

</td></tr>
</table>

`Object.assign({}, state, nextState)` 只在顶层做合并，`user` 作为顶层键被整个替换掉了。这个 bug 的恶劣之处在于它**完全静默**：TypeScript 也拦不住，因为 `set` 的参数类型是 `Partial<State>`，而 `{ name: 'Ada' }` 不是合法的 `User`——除非你的 `User` 所有字段都可选，那就真的一点提示都没有了。

嵌套超过两层的 store，建议直接上 immer 中间件，不要依赖人工逐层展开复制的纪律性。

#### 4.3 模块级 store 在 SSR 下跨请求污染

<table>
<tr><th>❌ 服务端所有请求共享</th><th>✅ 每请求独立 store</th></tr>
<tr><td>

```ts
// store.ts
export const useCart = create<Cart>()(set => ({ items: [] }));

// Node 进程内是模块单例，
// 用户 A 的购物车会串到用户 B
```

</td><td>

```tsx
// 每次请求造一个新 store
const createCartStore = () =>
    createStore<Cart>()(set => ({
        items: [],
    }));

const Ctx = createContext(null);

export function CartProvider({ children }) {
    const ref = useRef();
    if (!ref.current) {
        ref.current = createCartStore();
    }
    return <Ctx.Provider value={ref.current}>{children}</Ctx.Provider>;
}
```

</td></tr>
</table>

这个坑在纯客户端应用里不存在，一上 Next.js SSR 就会出现，而且**在开发环境常常测不出来**（单用户单请求）。消费侧记得用 `useStore(useContext(Ctx), selector)`。

**注意 Valtio 有完全相同的问题**——模块级 `proxy()` 同样是进程单例。这不是 Zustand 独有的缺陷，而是所有"模块级单例 store"方案的共性。两边的解法也一致：Provider + 每请求实例。

#### 4.4 Map / Set 与不可变的摩擦

```ts
// ❌ 原地改 Map，引用没变，Object.is 判定"没变化"，不会通知
set(s => {
    s.cache.set(key, value);
    return s;
});

// ✅ 造新 Map
set(s => {
    const cache = new Map(s.cache);
    cache.set(key, value);
    return { cache };
});
```

每次更新都全量复制 Map，条目多时成本可观。大规模 Map/Set 场景建议配 immer（它支持 `enableMapSet`），或者重新考虑数据结构。

#### 4.5 其余高频问题速记

- **状态重置**：Zustand 没有内置 reset。常见做法是保存 `initialState` 后 `set(initialState, true)`——注意第二个参数 `true` 表示 replace 而非 merge，漏掉它残留字段不会被清除。
- **store 之间互相依赖**：官方倾向单 store + slices 模式。多 store 互相 `getState()` 会形成隐式耦合，且容易在初始化顺序上翻车。
- **在 action 里读 state**：用 `set((s) => ...)` 的函数式写法，不要 `get()` 之后再 `set()`——后者在并发更新下可能基于陈旧值计算。

### Valtio 篇

#### 4.6 snap 与 state 的边界（走 actions 之后剩下什么）

传统上这被列为 Valtio 的头号坑：组件里写 `snap.count++`，点击毫无反应，且**因为当前版本的快照不做运行时冻结**（§3.2），写入不抛错，只是落在临时快照对象上然后被丢弃。

但这个形态的坑**在"写入一律走 actions"的约定下基本不存在**——组件里没有任何写入语句，也就没有写错对象的机会：

```tsx
// actions.ts —— 只有这里出现 state
export const actions = {
    inc: () => {
        state.count += 1;
    },
};

// Counter.tsx —— 只有这里出现 snap
function Counter() {
    const snap = useSnapshot(state);
    return <button onClick={actions.inc}>{snap.count}</button>;
}
```

读写在文件层面就分开了，**"该用 snap 还是 state"不再是逐行判断，而是由所在文件决定**。真正需要持续保持警惕的只剩三处，都发生在 action 的边界上或读侧。

**其一，不要把 snap 派生的值传给 action。** 这是把陈旧闭包和意外追踪一起引进来：

```tsx
function Editor() {
    const snap = useSnapshot(state);
    // ❌ snap.draft 只在回调里被读 → 渲染期没进 affected
    //    → draft 变了组件不重渲染 → 点击时拿到的是过期快照
    //    而这次读又会把 draft 记进 affected → 从下一次起过度订阅
    return <button onClick={() => actions.save(snap.draft)}>保存</button>;
}
```

两个问题叠加：`snap` 是那一次渲染的不可变切片，被长生命周期的闭包捕获后就冻在那儿；同时 `affected` 这张记录表在渲染之后依然存活，回调里的属性访问同样会被记进去，让这个组件从此对 `draft` 敏感——哪怕渲染逻辑根本没用到它。

正确形态是让 action 自己去读 `state`，组件只发信号：

```tsx
// actions.ts
export const actions = {
    save: () => api.save(state.draft), // proxy 永远是最新值
};

// ✅ 组件不搬运数据
<button onClick={actions.save}>保存</button>;
```

**规则：action 不接收任何来自 snap 的对象、也不接收任何"需要当前值"的参数，只接收 id、索引、以及事件里带出来的原始值。**

**其二，对象身份不同——这条比陈旧值严重，因为 TypeScript 挡不住。** 快照节点与 proxy 节点永远是两个不同的对象，`useSnapshot` 返回的还要再套一层追踪代理，中间隔了两层：

<table>
<tr><th>❌ 拿快照对象去 proxy 里定位</th><th>✅ 用 id 定位</th></tr>
<tr><td>

```ts
function remove(item: Item) {
    const i = state.items.indexOf(item);
    // 恒为 -1：item 是快照节点，
    // state.items 里装的是 proxy 节点
    state.items.splice(i, 1);
    // splice(-1, 1) → 静默删掉最后一个
}
```

</td><td>

```ts
function remove(id: string) {
    const i = state.items.findIndex(it => it.id === id);
    if (i !== -1) state.items.splice(i, 1);
}
```

</td></tr>
</table>

`indexOf` / `includes` / `Set.has` / 用对象当 Map 的 key / 任何 `===` 比较，全部踩这个坑。**而 `Snapshot<Item>` 传给 `indexOf(item: Item)` 通常能通过类型检查**——`readonly` 修饰在结构兼容判断里是协变的，编译器放行，运行时静默错。这是"靠深度 readonly 当护栏"在此处唯一失效的地方，只能靠"action 参数一律用 id"这条纪律绕开。

**其三，反向的坑：渲染期读了 `state`。** 约定管的是写入侧，覆盖不到这一条。派生逻辑、`useMemo`、自定义 hook 里漏出一个 `state.xxx`，读到的值是对的，但**没有建立订阅** → 该更新时不更新，无报错无警告。这就是 §3.3 那张表里"少渲染极难查"的那一栏。

> **这三条与前一版的差别在于性质**：不再是"每写一行都要判断用哪个对象"，而是"守住 action 签名 + 渲染期只碰 snap"两条可以写进 review checklist、也能部分交给 lint 规则的约束。心智负担显著下降，但**它仍然是约定而非机制**：TypeScript 挡得住 `snap.count++`，挡不住对象身份问题，也挡不住渲染期漏读 `state`。
>
> 所以选型上的结论不变，只是理由收窄了：**纯 JavaScript 项目、或 `@ts-ignore` 泛滥的项目会失去第一层防护；成员流动大、缺少 code review 的团队守不住剩下两层。** 这两种情况下应该直接倾向 Zustand。

#### 4.7 什么会被代理，什么不会

`canProxy` 的默认实现明确排除了一批类型：

```ts
const canProxyDefault = x =>
    isObject(x) &&
    !refSet.has(x) &&
    (Array.isArray(x) || !(Symbol.iterator in x)) && // 排除 Map/Set 等可迭代对象
    !(x instanceof WeakMap) &&
    !(x instanceof WeakSet) &&
    !(x instanceof Error) &&
    !(x instanceof Number) &&
    !(x instanceof Date) &&
    !(x instanceof String) &&
    !(x instanceof RegExp) &&
    !(x instanceof ArrayBuffer) &&
    !(x instanceof Promise);
```

由此推出两条实践结论：

**其一，Map / Set 不会被代理**（它们有 `Symbol.iterator` 且不是数组），改它们不会触发更新。必须用官方替代品：

```ts
import { proxyMap, proxySet } from 'valtio/utils';

const state = proxy({
    cache: proxyMap<string, User>(),
    tags: proxySet<string>(),
});
```

**其二，普通 class 实例会被深度代理**——它不在排除清单里。这经常不是你想要的：

<table>
<tr><th>❌ 整个实例被深度代理</th><th>✅ 用 ref 跳过</th></tr>
<tr><td>

```ts
const state = proxy({
    editor: new MonacoEditor(),
    chart: new EChartsInstance(),
});
// 内部每个属性都被 Proxy 包裹，
// 性能损耗大，且可能破坏
// 依赖 this 身份的内部逻辑
```

</td><td>

```ts
import { ref } from 'valtio';

const state = proxy({
    editor: ref(new MonacoEditor()),
    chart: ref(new EChartsInstance()),
});
// ref 标记的对象跳过代理，
// 也不参与快照与变更追踪
```

</td></tr>
</table>

DOM 节点、第三方库实例、大体积只读数据（长列表原始数据、地图瓦片）都应该用 `ref()` 包起来。这是 Valtio 项目里最常见的性能优化手段。

#### 4.8 v2 的 `proxy()` 变成了原地修改

这是 v1 → v2 最容易被忽略的破坏性变更：

```ts
const base = { count: 0, nested: { a: 1 } };
const state = proxy(base);

// v1：base 被深拷贝，base 完好无损
// v2：base 被原地改造，它的属性已经被替换成 proxy
```

如果你的代码里有"用同一个初始对象创建多个 store"或"创建 store 后还继续读原对象"的写法，v2 下会出现难以定位的串扰。官方给出的迁移办法是显式深拷贝：

```ts
const state = proxy(deepClone(base));
```

这个变更本身很有意思——**Valtio 连自己的构造函数都从不可变语义倒向了可变语义**，以此换取性能。它精准地体现了本文的主题：可变模型总是在用"可预测性"交换"效率与便利"。

#### 4.9 调试期的观察者效应

```ts
// ⚠️ 在渲染中打印快照，可能把所有属性标记为"已访问"
console.log(snap);
```

`snap` 是追踪代理，DevTools 展开它的过程会触发 `get` 陷阱，把属性记进 `affected`，从而**扩大这个组件的订阅范围**。你为了排查渲染问题而加的日志，本身改变了渲染行为。

排查依赖追踪问题时，改用非侵入方式：

```ts
console.log(snapshot(state)); // 拿纯快照，不经过追踪代理
```

Valtio 在开发环境下还会通过 `useAffectedDebugValue` 把追踪到的路径显示在 React DevTools 的 hooks 面板里，这是查"为什么它渲染了/没渲染"的第一手段。

#### 4.10 React Compiler 与未来走向

React Compiler 的核心假设是 props 与 state 不可变。Valtio 的 `useSnapshot` 返回不可变快照，所以能兼容——但 v2 为此调整了 `useSnapshot` 的实现，官方明确说明**边缘场景下可能产生额外的重渲染**。

Zustand 这边没有这个张力：`useSyncExternalStore` 是 React 官方为外部 store 提供的正规接口，编译器对它有明确处理。

**从长期押注的角度看，Zustand 与 React 主线演进方向的对齐度更高。** 这不代表 Valtio 会有问题，但它需要持续投入去追平编译器的假设，而 Zustand 基本是顺流而下。

---

## 5. 工程化维度

面向选型决策，下面这些往往比 API 手感更重要。

### 5.1 团队上手成本

|                | Zustand                    | Valtio                       |
| -------------- | -------------------------- | ---------------------------- |
| 第一天就能写对 | 基本能                     | 基本能                       |
| 第一周能写好   | 需理解 selector 与引用相等 | 需守住 action 边界的传参纪律 |
| 写错的反馈     | 快且响亮（报错、明显卡顿） | 慢且安静（少渲染、陈旧值）   |
| 排查难度       | 低，栈直、行为显式         | 高，需理解 proxy-compare     |

两者的学习曲线形状不同：Zustand 的难点是"必须学会一件事"（selector 稳定性），学会之后基本一劳永逸；Valtio 的难点是"必须持续保持一种纪律"，且违反纪律时基本没有自动化手段兜底。

**但走 actions 之后这条纪律比通常描述的要窄得多。** 它不是"每次访问状态都要判断用 snap 还是 state"——那由文件位置决定了；而是两条可以写进 review checklist 的规则：

1. **action 只接收 id / 索引 / 事件原始值**，不接收 snap 对象、也不接收需要"当前值"的参数（§4.6 第一、二条）。
2. **渲染期只碰 snap**，派生逻辑和自定义 hook 里不要漏出 `state.xxx`（§4.6 第三条）。

第 1 条基本可以靠"actions 的参数类型只允许原始值"这种签名约定自我强制；第 2 条目前只能靠 review 与 `useAffectedDebugValue`（§4.9）事后排查。**所以团队上手成本的真实差距，落在有没有稳定的 review 习惯上，而不是落在 API 复杂度上。**

### 5.2 TypeScript 体验

**Zustand** 的类型能力更强，但也更绕：

```ts
// curried 写法是带类型时的强制要求
create<State>()((set) => ({ ... }))

// 中间件叠加后类型签名会变得相当可观
const useStore = create<State>()(
  devtools(persist(immer((set) => ({ ... })), { name: 'app' })),
)
```

中间件组合时的类型推导是 Zustand 长期的粗糙面，写自定义中间件需要理解 `StateCreator` 的 mutator 元组，门槛明显偏高。但**在使用侧类型是准确的**，selector 的返回类型能被正确推断。

**Valtio** 的类型更简单，核心就是 `Snapshot<T>`：

```ts
const snap = useSnapshot(state); // Snapshot<State>，深度 readonly
```

深度 `readonly` 是"误写快照"的唯一防线（§4.6），价值极高——尽管走 actions 之后它更多是兜底而非日常依赖。粗糙面在于 getter 定义的计算属性有时需要显式标注类型才能推断正确，以及 `ref()` 包裹后的类型需要额外留意。

### 5.3 调试与可观测性

两者都能接 Redux DevTools，但信息质量不同：

|              | Zustand                 | Valtio                         |
| ------------ | ----------------------- | ------------------------------ |
| 变更粒度     | 整个 state 快照         | 精确到路径的 op                |
| action 命名  | devtools 中间件支持具名 | 默认无语义名，可自己包一层补上 |
| 时间旅行     | 支持                    | 支持（`valtio-history`）       |
| 定位"谁改的" | 需自己在 action 里打点  | op 自带路径，调用来源需自己补  |

**Zustand 的优势是变更有名字**——`set(partial, false, 'cart/addItem')` 让 DevTools 里的时间线可读。**Valtio 的优势是变更有路径**——`[op, path, value, prevValue]` 是现成的，Zustand 那侧要自己 diff 才能得到。

两者缺的正好是对方有的，而**在走 actions 的前提下，Valtio 缺的那一半可以补齐**：既然写入已经收口，给每个 action 套一层就能把名字接到 op 流上。

```ts
let currentAction: string | null = null;

export function traced<T extends Record<string, (...a: any[]) => any>>(
    actions: T,
): T {
    return Object.fromEntries(
        Object.entries(actions).map(([name, fn]) => [
            name,
            (...args: any[]) => {
                const prev = currentAction;
                currentAction = name;
                try {
                    return fn(...args);
                } finally {
                    currentAction = prev;
                }
            },
        ]),
    ) as T;
}

// 必须开 sync：默认的微任务批处理会让 ops 晚于 currentAction 复位才到达
subscribe(
    state,
    ops => {
        for (const [type, path, value, prevValue] of ops) {
            console.log(
                `[${currentAction ?? 'unknown'}] ${type} ${path.join('.')}`,
                prevValue,
                '→',
                value,
            );
        }
    },
    true,
);
```

两点代价要清楚：**`sync: true` 放弃了批处理**（一个 action 里改三个字段就通知三次）；**异步 action 里 `await` 之后的写入已脱离同步栈**，`currentAction` 归属会错，需要在 await 前后自己重新标记。

补齐之后，"谁在什么时候把哪条路径从什么改成了什么"就完整了，撤销重做、审计日志、增量持久化才真的能做——`valtio-history`（v2 前以 `proxyWithHistory` 形式在 `valtio/utils` 里）走的就是这条路。

**结论要比前一版温和**：Zustand 的收口是机制性的、开箱带名字；Valtio 的收口是约定性的、名字要自己接一层。**差距从"能不能审计"变成了"要不要写这三十行"**——但前者作为结构性约束在多人协作时仍然更可靠，因为它不依赖任何人守规矩。

### 5.4 SSR 与 Next.js App Router

如 §4.3 所述，两者面临同样的模块单例问题和同样的解法。差异在于**文档成熟度**：Zustand 有专门的 `ssr-and-hydration`、`nextjs`、`initialize-state-with-props` 指南，覆盖了水合不匹配、per-request store、从 props 初始化等场景。Valtio 这方面的文档要薄不少，很多模式需要自己摸索。

对于重度 Next.js 项目，这个文档差距是实打实的工期差距。

### 5.5 可测试性

两者都不依赖 Provider，单测都比 Redux 时代轻松，但**测试间的状态隔离**方式不同。

<table>
<tr><th>Zustand</th><th>Valtio</th></tr>
<tr><td>

```ts
const initial = useStore.getState();

beforeEach(() => {
    // 第二个参数 true = replace
    useStore.setState(initial, true);
});

it('adds item', () => {
    useStore.getState().add(item);
    expect(useStore.getState().items).toHaveLength(1);
});
```

</td><td>

```ts
const initial = snapshot(state);

beforeEach(() => {
    Object.assign(state, initial);
});

it('adds item', () => {
    actions.add(item);
    // 注意：默认批处理是微任务
    expect(state.items).toHaveLength(1);
});
```

</td></tr>
</table>

两处工程差异值得注意：

**其一，重置的可靠性。** Zustand 的 `setState(initial, true)` 语义明确。Valtio 侧 `Object.assign` 只覆盖顶层键——**新增的键不会被清除**，深层对象也可能残留引用，隔离不彻底。稳妥做法是每个测试重新 `proxy(deepClone(initialShape))` 造新实例，但这样又要处理模块级导出的替换问题。

顺带一提，走 actions 对测试是纯收益：**测试直接调 action、断言 state，完全不需要渲染组件，也不涉及 snap**（上面的例子就是这个形态）。快照相关的时序与追踪问题只在组件测试里才需要考虑。

**其二，异步时序。** Valtio 的订阅默认走微任务批处理，测试里断言"订阅被调用"必须 `await` 一个微任务，或用 `subscribe(state, cb, true)` 开同步模式。直接同步断言会得到假阴性。对 proxy 本身的读取是同步的，不受影响；受影响的是订阅与组件渲染。

Zustand 官方有专门的 `testing` 指南（含 Vitest/Jest 的自动 mock 方案），Valtio 这方面同样需要自己摸索。

### 5.6 运行环境约束

**这一条可能是唯一的硬否决项**：Valtio 强依赖 ES6 `Proxy`，而 **`Proxy` 无法被 polyfill**（它拦截的是语言层面的基础操作）。

- 需要支持 IE11 或同等老旧环境 → Valtio 直接出局。
- React Native：可用，但要留意引擎差异。v2.3.2 这个版本就是专门为了修 Hermes 的兼容问题（移除 `Object.preventExtensions`）而发的——**这类边缘问题会持续存在**。
- 小程序等非标准 JS 环境：需要实测 Proxy 支持度。

Zustand 没有任何特殊环境要求。

### 5.7 生态与维护

两者同属 pmndrs，作者相同，维护都健康活跃。差距在**采用规模**：Zustand 是当前 React 状态管理的事实默认选项之一，周下载量数倍于 Valtio，中间件生态（persist、devtools、immer、subscribeWithSelector、redux 兼容层）成熟，Stack Overflow 与 AI 助手的答案质量也明显更好。

Valtio 用户基数小得多，遇到冷门问题时可参考的资料显著更少。**对于需要控制技术风险的团队，这是一个真实的成本项。**

---

## 6. 选型结论

### 选 Zustand，如果——

- **团队规模大或成员水平参差**。变更必须走 action 收口，错误反馈响亮且快，这些结构性约束的价值随团队规模非线性增长。
- **需要开箱可审计的变更链路**。金融、医疗、协作编辑等场景，"谁在什么时候改了什么"必须可追溯，而且这份保证不能依赖任何人守规矩。（Valtio 配合 actions 也能做到，但需要自己接一层，见 §5.3。）
- **重度依赖 SSR / Next.js**。文档与社区实践成熟太多。
- **需要现成的中间件**。持久化、DevTools 集成、Redux 迁移路径都是开箱即用。
- **环境有兼容性要求**。不确定目标环境的 Proxy 支持度时，别赌。

### 选 Valtio，如果——

- **状态树深且更新琐碎**。表单编辑器、画布应用、可视化配置面板这类场景，`state.a.b.c.d = x` 相比逐层展开复制的收益是压倒性的。
- **想彻底摆脱 selector 心智**。自动依赖追踪确实能消除一整类性能问题，前提是渲染期只碰 snap。
- **需要细粒度的变更路径**。subscribe 自带路径，做增量持久化、协同编辑的 patch 同步时省掉一大块工作。
- **TypeScript 严格、有稳定的 code review 习惯**。加上"写入一律走 actions"这条约定，能把 Valtio 的风险压到最低，同时拿满它的收益。团队规模本身不是关键，能不能维持约定才是。
- **从 MobX / Vue 迁移过来**。心智模型几乎无缝。
