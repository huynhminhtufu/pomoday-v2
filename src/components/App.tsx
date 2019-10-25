import * as React from 'react';
import marked from 'marked';

enum RowType {
  TAG,
  TASK,
  TEXT
};

enum TaskStatus {
  DONE,
  WIP,
  WAIT
}

type Command = {
  command: string,
  tag?: string,
  text: string
} | null;

const parse = (str: string) => str.match(/(t(?:ask)?)\s(@(?:\S*['-]?)(?:[0-9a-zA-Z'-]+))?(.*)/);
const parseCommand = (input: string): Command => {
  const match = parse(input);
  if (match) {
    return {
      command: match[1],
      tag: match[2],
      text: match[3].trim()
    } as Command;
  }
  return null;
};

const getStatus = (status?: TaskStatus) => {
  switch (status) {
    case TaskStatus.DONE: return <span className="text-green-600">✔</span>;
    case TaskStatus.WIP: return <span className="text-orange-500">…</span>;
    case TaskStatus.WAIT: return <span className="text-gray-500">□</span>;
    default: return null;
  }
};

type TaskItem = {
  id: number;
  tag: string;
  title: string;
  status: TaskStatus;
};

const TaskItemDisplay = props => {
  const title = props.title;
  const status = props.status;
  const counter = props.counter;
  return <>
    <div className="w-12 text-right mr-2">{counter}. </div>
    <div className="flex-1 text-left">{getStatus(status)} <span className="inline-block" dangerouslySetInnerHTML={{__html: title}}></span></div>
  </>;
};

const Row = (props) => {
  const type = props.type;
  const title = props.title || "";
  const status = props.status || undefined;
  const counter = props.counter || undefined;
  return <div className={`row ${type === RowType.TAG ? 'font-bold underline' : (type === RowType.TEXT && !title.length ? 'p-3' : 'flex flex-row')}`}>
    {type === RowType.TASK ? <TaskItemDisplay title={marked(title)} status={status} counter={counter} /> : ( type === RowType.TEXT ? <span className="inline-block" dangerouslySetInnerHTML={{__html: marked(title)}}></span> : title)}
  </div>;
};

const getInitialState = () => {
  if (window.localStorage) {
    const saved = window.localStorage.getItem('pomoday');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed) {
          return parsed;
        }
      } catch {}
    }
  }
  return {
    tasks: [] as TaskItem[]
  };
};

export const App = () => {
  const inputRef = React.useRef(null);
  const [ state, setState ] = React.useState(getInitialState());

  React.useEffect(() => {
    window.localStorage.setItem('pomoday', JSON.stringify(state));
  }, [state]);

  const onKeyPress = e => {
    if (inputRef && inputRef.current) {
      const key = e.which || e.keyCode;
      if (key === 13) {
        const cmd = parseCommand(inputRef.current.value);
        if (cmd) {
          switch (cmd.command) {
            case "t" || "task":
              const tag = cmd.tag || "@uncategorized";
              const task = cmd.text;
              const nextId = state.tasks.reduce((maxId: number, t: TaskItem) => {
                if (t.id > maxId) {
                  maxId = t.id;
                }
                return maxId;
              }, 0);
              setState({
                ...state,
                tasks: state.tasks.concat({
                  id: nextId + 1,
                  tag: tag,
                  title: task,
                  status: TaskStatus.WAIT
                } as TaskItem)
              })
              break;
          }
        }
        inputRef.current.value = "";
      }
    }
  };

  const taskGroups = state.tasks.reduce((groups, t) => {
    if (!groups[t.tag]) {
      groups[t.tag] = [];
    }
    groups[t.tag].push(t);
    return groups;
  }, {});

  const summary = state.tasks.reduce((stats, t) => {
    switch (t.status) {
      case TaskStatus.WAIT:
        stats.pending += 1;
        break;
      case TaskStatus.DONE:
        stats.done += 1;
        break;
      case TaskStatus.WIP:
        stats.wip += 1;
        break;
    }
    return stats;
  }, {
    done: 0,
    wip: 0,
    pending: 0
  })

  return <div className="w-full h-full flex flex-col">
    <div className="p-2 bg-gray-100 text-sm"></div>
    <div className="flex-1 p-5">
      {Object.keys(taskGroups).map((g, i) => [
        <Row key={`tag-${i}`} type={RowType.TAG} title={g} />,
        taskGroups[g].map((t, j) => <Row key={`tag-${i}-inner-task-${j}`} type={RowType.TASK} status={t.status} title={t.title} counter={t.id} />),
        <Row key={`tag-${i}-separator-${i}`} type={RowType.TEXT} title="" />
      ])}
      <Row type={RowType.TEXT} title={`${(summary.done/state.tasks.length * 100).toFixed(0)}% of all tasks complete.`} />
      <Row type={RowType.TEXT} title={`<span class="text-green-500">${summary.done}</span> done · <span class="text-orange-500">${summary.wip}</span> in-progress · <span class="text-purple-500">${summary.pending}</span> waiting`} />
    </div>
    <input ref={inputRef} className="bg-gray-300 p-2 text-sm" tabIndex={0} autoFocus={true} onKeyPress={onKeyPress} placeholder="enter anything here..." />
  </div>;
};