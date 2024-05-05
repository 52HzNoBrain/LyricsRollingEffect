import './style.css';
import { getAllSong } from '@src/api/songApi';

type lrcObj = {
  time: number;
  lyric: string;
};

const doms = {
  audio: document.querySelector('audio') as HTMLAudioElement,
  ul: document.querySelector('.container .lrc-list') as HTMLElement,
  container: document.querySelector('.container') as HTMLElement,
  songUl: document.querySelector('.song-list') as HTMLElement,
  songCon: document.querySelector('.song-list-con') as HTMLElement,
};

//数据处理

/**
 * 获取歌词的String类型
 * @returns
 */
// const getSongByStr = async () => {
//   const res = await getSong();
//   return res;
// };

/**
 * 获取歌词的Array类型
 * @returns
 */
const getSongByArray = async (songStr: string = '') => {
  if (songStr === '') {
    return [];
  }
  //将str使用累加器处理成数对象数组
  const array = songStr
    .trim()
    .split('\n')
    .reduce((arr: Array<lrcObj>, item) => {
      const [time, lyric] = item.split(']');
      if (time) {
        const obj = {
          time: getTimeForSecond(time.substring(1)),
          lyric: lyric || ' ',
        };
        arr.push(obj);
        return arr;
      }
      return arr;
    }, []);
  return array;
};

/**
 * 将时间字符串转换为秒
 * @param time
 * @returns
 */
const getTimeForSecond = (time: string) => {
  const [min, sec] = time.split(':');
  return Number(min) * 60 + Number(sec);
};

/**
 * 获取当前播放时间对应的歌词索引
 * @returns
 */
const findSongIndex = (songLrcArray: Array<lrcObj>) => {
  const currentTime = doms.audio?.currentTime || 0;

  for (let i = 0; i < songLrcArray.length; i++) {
    const { time } = songLrcArray[i];
    const timeDifference = time - currentTime;

    if (timeDifference > 0) {
      return i - 1;
    }
  }

  return songLrcArray.length - 1;
};

//界面

//创建全部歌单

/**
 * 创建歌词
 * @param songLrcArray
 */
const createLrcElement = (songLrcArray: Array<lrcObj>) => {
  if (songLrcArray.length === 0) {
    const li = document.createElement('li');
    li.innerText = '暂无歌词';
    li.classList.add('active');
    doms.ul?.appendChild(li);
  }
  const frag = document.createDocumentFragment();
  songLrcArray.map((item: lrcObj) => {
    const li = document.createElement('li');
    li.innerText = item.lyric;
    frag.appendChild(li);
  });
  doms.ul?.appendChild(frag);
};

/**
 * 设置歌词偏移
 * @param index
 * @param containerHeight
 * @param liHeight
 * @param maxOffset
 */
const setOffset = (
  index: number,
  containerHeight: number,
  liHeight: number,
  maxOffset: number,
) => {
  let offset = liHeight * index + liHeight / 2 - containerHeight / 2;

  //最小边界
  if (offset < 0) {
    offset = 0;
  }

  //最大边界
  if (offset > maxOffset) {
    offset = maxOffset;
  }

  const active = doms.ul.querySelector('.active') as HTMLElement;
  if (active) {
    active.classList.remove('active');
  }

  doms.ul.style.transform = `translateY(-${offset}px)`;
  doms.ul.children[index].classList.add('active');
};

/**
 * 注册歌词滚动
 */
const registerSongLrcView = async (songStr: string) => {
  const songLrcArray = await getSongByArray(songStr);
  createLrcElement(songLrcArray);

  if (songLrcArray.length === 0) {
    return;
  }

  //渲染完li再获取高度
  const containerHeight = doms.container?.clientHeight || 0;
  const liHeight = doms.ul?.children[0]?.clientHeight || 0;
  const maxOffset = doms.ul?.clientHeight || 0;

  const index = findSongIndex(songLrcArray);
  setOffset(index, containerHeight, liHeight, maxOffset);

  doms.audio?.addEventListener('timeupdate', () => {
    const index = findSongIndex(songLrcArray);
    setOffset(index, containerHeight, liHeight, maxOffset);
  });
};

/**
 * 发起 Fetch 请求获取音频流
 * @param songName
 */
const playOneSongByStream = (songName: string) => {
  fetch(`http://localhost:3000/api/getOneSong/${songName}`)
    .then((response) => response.blob())
    .then((blob) => {
      // 创建 URL 对象
      const url = URL.createObjectURL(blob);

      // 设置音频元素的 src
      doms.audio.src = url;
    })
    .catch((error) => console.error('Error fetching audio stream:', error));
};

type songListType = {
  uuid: string;
  name: string;
  imgPath: string;
};

const createSongListElement = (allSongList: Array<any>) => {
  const frag = document.createDocumentFragment();

  // 循环处理数据
  allSongList.forEach((item: songListType) => {
    // 创建 <li> 元素
    const li = document.createElement('li');
    li.className = 'song';
    li.setAttribute('data-uuid', item.uuid);

    // 创建 <div class="song-img">
    const imgDiv = document.createElement('div');
    imgDiv.className = 'song-img';
    imgDiv.style.backgroundImage = `url('${item.imgPath}')`;
    // const span = document.createElement('span');
    // imgDiv.appendChild(span);
    li.appendChild(imgDiv);

    // 创建 <div class="song-name">
    const nameDiv = document.createElement('div');
    nameDiv.className = 'song-name';
    nameDiv.textContent = item.name;
    li.appendChild(nameDiv);

    frag.appendChild(li);
  });
  // 将 <li> 元素插入到父元素中
  doms.songUl.appendChild(frag);
};

/**
 * 设置歌曲列表偏移
 * @param index
 * @param song
 */
const setOffsetBySongList = (index = 0, song: HTMLElement) => {
  //计算songListCond的宽度
  const songListConWidth = doms.songCon?.clientWidth || 0;
  //计算每个songListLi的宽度
  const songListLi = doms.songUl?.children[0];
  //计算全部songListLi的宽度
  let songListLiWidth = 0;

  if (songListLi) {
    const computedStyle = window.getComputedStyle(songListLi); // 获取元素的实际样式

    // 获取元素的宽度和左右 margin 的值，并将它们相加
    songListLiWidth =
      songListLi.clientWidth +
      parseInt(computedStyle.marginLeft) +
      parseInt(computedStyle.marginRight);
  }

  //计算需要的偏移量
  let offset =
    songListLiWidth * index + songListLiWidth / 2 - songListConWidth / 2;

  //最小边界
  if (offset < 0) {
    offset = 0;
  }

  const playList = document.querySelectorAll('.song-list-con .song-list .play');
  playList.forEach((item) => {
    item.classList.remove('play');
  });

  doms.songUl.style.transform = `translateX(-${offset}px)`;
  doms.songUl.children[index].classList.add('play');
  if (song) {
    song.querySelector('.song-img')?.classList.add('play');
  }
};

/**
 * 注册歌曲列表
 */
const registerSongListView = async () => {
  //获取所有歌曲
  const allSongList: any = await getAllSong();

  //注册歌词功能
  registerSongLrcView(allSongList[0].lrc);

  //创建元素
  createSongListElement(allSongList);

  //播放歌曲
  playOneSongByStream(allSongList[0].uuid);

  //获取当前点击的歌曲
  doms.songUl.addEventListener('click', (event: MouseEvent) => {
    const target = event.target as HTMLElement; // 将事件目标断言为 HTMLElement 类型

    // 如果点击的不是 .song 元素，则向上遍历 DOM 直到找到 .song 元素
    if (!target.matches('.song') && !target.closest('.song')) return;

    let domIndex = 0;

    const song = target.closest('.song') as HTMLElement;

    // 使用 forEach 方法遍历所有 .song 元素
    doms.songUl.querySelectorAll('.song').forEach((song, index) => {
      // 如果点击的元素与当前遍历到的 song 元素相同，则打印出索引
      if (song === target.closest('.song')) {
        domIndex = index;
      }
    });
    doms.ul.innerHTML = '';
    //注册歌词功能
    registerSongLrcView(allSongList[domIndex].lrc);

    // 检查是否找到了符合条件的元素
    if (song) {
      // 获取 data-uuid 属性的值
      const uuid = song.getAttribute('data-uuid') as string;
      playOneSongByStream(uuid);
      doms.audio.addEventListener('canplay', () => {
        doms.audio.play();
      });
    } else {
      console.log('No <li> element with data-uuid attribute found.');
    }
    setOffsetBySongList(domIndex, song);
  });

  //存储播放时间
  savecurrentTime();
};

/**
 * 存储播放时间
 */
const savecurrentTime = () => {
  const storageKey = 'audioPlaybackPosition' as string;
  const locStor = localStorage.getItem(storageKey) as string;
  // 检查是否存在缓存
  if (locStor) {
    // 从缓存中获取播放时间并设置音频播放时间
    const playbackPosition = parseFloat(locStor);
    doms.audio.currentTime = playbackPosition;
  }

  // 监听音频的播放事件
  doms.audio.addEventListener('play', () => {
    // 存储当前播放时间到本地存储
    localStorage.setItem(storageKey, doms.audio.currentTime.toString());
  });

  // 监听音频的结束事件
  doms.audio.addEventListener('ended', () => {
    // 清除本地存储的播放时间
    localStorage.removeItem(storageKey);
    // 重新播放音频
    doms.audio.currentTime = 0;
    doms.audio.play();
  });
};

const main = () => {
  //注册歌曲列表
  registerSongListView();
};

main();
