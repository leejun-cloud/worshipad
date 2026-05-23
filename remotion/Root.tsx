import { Composition } from 'remotion';
import {
  ActionReel,
  ACTION_TOTAL_DURATION,
  actionSchema,
  calculateActionDuration,
} from './templates/Action/ActionReel';
import {
  EmotionReel,
  EMOTION_TOTAL_DURATION,
  emotionSchema,
  calculateEmotionDuration,
} from './templates/Emotion/EmotionReel';
import {
  NewsReel,
  NEWS_TOTAL_DURATION,
  newsSchema,
  calculateNewsDuration,
} from './templates/News/NewsReel';
import {
  InsightReel,
  INSIGHT_TOTAL_DURATION,
  insightSchema,
  calculateInsightDuration,
} from './templates/Insight/InsightReel';
import {
  ListReel,
  LIST_DEFAULT_DURATION,
  listSchema,
  calculateListDuration,
} from './templates/List/ListReel';
import {
  PhotoReel,
  PHOTO_DEFAULT_DURATION,
  photoSchema,
  calculatePhotoDuration,
} from './templates/Photo/PhotoReel';
import {
  LectureReel,
  LECTURE_DEFAULT_DURATION,
  LECTURE_WIDTH,
  LECTURE_HEIGHT,
  lectureSchema,
  calculateLectureDuration,
} from './templates/Lecture/LectureReel';
import { ThumbnailScene, thumbnailSchema } from './templates/Lecture/ThumbnailScene';
import {
  ChurchAdReel,
  CHURCH_AD_DEFAULT_DURATION,
  CHURCH_AD_WIDTH,
  CHURCH_AD_HEIGHT,
  churchAdSchema,
  calculateChurchAdDuration,
} from './templates/ChurchAd/ChurchAdReel';
import { REELS_FPS, REELS_WIDTH, REELS_HEIGHT } from './types';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="ActionReel"
        component={ActionReel}
        schema={actionSchema}
        durationInFrames={ACTION_TOTAL_DURATION}
        fps={REELS_FPS}
        width={REELS_WIDTH}
        height={REELS_HEIGHT}
        calculateMetadata={({ props }) => ({
          durationInFrames: calculateActionDuration(props.audioDurationSec),
        })}
        defaultProps={{
          problem: '아직도 작심삼일로 끝나시나요?',
          solution: '하루 10분, 단순한 루틴이면 충분합니다',
          benefit: '3일이면 됩니다',
          cta: '지금 시작하세요',
        }}
      />

      <Composition
        id="EmotionReel"
        component={EmotionReel}
        schema={emotionSchema}
        durationInFrames={EMOTION_TOTAL_DURATION}
        fps={REELS_FPS}
        width={REELS_WIDTH}
        height={REELS_HEIGHT}
        calculateMetadata={({ props }) => ({
          durationInFrames: calculateEmotionDuration(props.audioDurationSec),
        })}
        defaultProps={{
          opening: '30년 만이었습니다.',
          story: '어린 시절 옆집에 살던 친구가 있었어요. 이사 가는 날, 우리는 마지막 인사를 나눴죠. 시간이 흘러 나는 그 친구를 잊었습니다.',
          message: '그런데 어느 봄날, 우연히 같은 카페에서 다시 만났어요.',
          closing: '인연은, 사라지지 않습니다.',
        }}
      />

      <Composition
        id="NewsReel"
        component={NewsReel}
        schema={newsSchema}
        durationInFrames={NEWS_TOTAL_DURATION}
        fps={REELS_FPS}
        width={REELS_WIDTH}
        height={REELS_HEIGHT}
        calculateMetadata={({ props }) => ({
          durationInFrames: calculateNewsDuration(props.audioDurationSec),
        })}
        defaultProps={{
          headline: '2026 봄 콘퍼런스 개최',
          when: '2026년 5월 15일 오후 2시',
          where: '서울 강남 COEX 그랜드홀',
          what: 'AI와 콘텐츠 크리에이터의 만남',
          action: '홈페이지에서 지금 신청하세요',
        }}
      />

      <Composition
        id="ListReel"
        component={ListReel}
        schema={listSchema}
        durationInFrames={LIST_DEFAULT_DURATION}
        fps={REELS_FPS}
        width={REELS_WIDTH}
        height={REELS_HEIGHT}
        calculateMetadata={({ props }) => ({
          durationInFrames: calculateListDuration(
            props.items?.length ?? 5,
            props.audioDurationSec,
            props.sceneDurationsSec
          ),
        })}
        defaultProps={{
          headline: 'AI 시대 학습법, 5가지 핵심',
          hook: '바쁜 학부모와 학생을 위한 실전 가이드',
          items: [
            { title: '루브릭 공동 제작', description: '학생과 함께 평가 기준을 만든다', benefit: '메타인지 상승' },
            { title: 'AI 활용 과정 평가', description: '결과물보다 수정 과정을 본다', benefit: '비판적 사고 측정' },
            { title: '실패의 흔적 보존', description: '포트폴리오에 초안과 실수도 담는다', benefit: '성장 추적' },
            { title: '구두 발표 평가', description: '5분 동안 직접 설명하게 한다', benefit: '진짜 이해도 측정' },
            { title: '수정 제출 공식화', description: '제출은 끝이 아닌 학습의 시작이다', benefit: '평가 문화 변화' },
          ],
          cta: '지금 저장하고 다음 학기에 적용하세요',
        }}
      />

      <Composition
        id="InsightReel"
        component={InsightReel}
        schema={insightSchema}
        durationInFrames={INSIGHT_TOTAL_DURATION}
        fps={REELS_FPS}
        width={REELS_WIDTH}
        height={REELS_HEIGHT}
        calculateMetadata={({ props }) => ({
          durationInFrames: calculateInsightDuration(props.audioDurationSec),
        })}
        defaultProps={{
          quote: '매일 조금씩, 그게 전부다.',
          elaboration: '큰 변화는 작은 습관에서 시작됩니다.',
          source: '제임스 클리어',
        }}
      />

      <Composition
        id="PhotoReel"
        component={PhotoReel}
        schema={photoSchema}
        durationInFrames={PHOTO_DEFAULT_DURATION}
        fps={REELS_FPS}
        width={REELS_WIDTH}
        height={REELS_HEIGHT}
        calculateMetadata={({ props }) => ({
          durationInFrames: calculatePhotoDuration(
            props.cards?.length ?? 3,
            props.audioDurationSec,
            props.sceneDurationsSec
          ),
        })}
        defaultProps={{
          hookHeadline: '당신이 몰랐던 충격적인 사실',
          coverMediaType: 'image' as const,
          audioDurationSec: 0,
          bgmVolume: 0.15,
          cards: [
            { headline: '99%가 모르는 진실', body: '알고 나면 달라집니다', mediaType: 'image' as const },
            { headline: '지금 당장 필요한 것', body: '단 하나뿐입니다', mediaType: 'image' as const },
            { headline: '오늘부터 바꾸세요', body: '3분이면 충분합니다', mediaType: 'image' as const },
          ],
          cta: '저장하고 실천하세요',
        }}
      />
      <Composition
        id="LectureReel"
        component={LectureReel}
        schema={lectureSchema}
        durationInFrames={LECTURE_DEFAULT_DURATION}
        fps={REELS_FPS}
        width={LECTURE_WIDTH}
        height={LECTURE_HEIGHT}
        calculateMetadata={({ props }) => ({
          durationInFrames: calculateLectureDuration(
            props.slides?.length ?? 8,
            props.audioDurationSec,
            props.sceneDurationsSec
          ),
        })}
        defaultProps={{
          title: 'AI 시대 학습법 완전 정리',
          accentColor: '#4f8ef7',
          audioDurationSec: 0,
          bgmVolume: 0.08,
          slides: [
            { type: 'title' as const, heading: 'AI 시대 학습법 완전 정리', subheading: '지금 당장 써먹는 5가지 핵심 전략', mediaType: 'image' as const, speakerNote: '오늘은 AI 시대 학습법에 대해 알아보겠습니다.' },
            { type: 'agenda' as const, heading: '목차', bullets: ['문제 정의', '핵심 전략 1', '핵심 전략 2', '핵심 요약'], mediaType: 'image' as const, speakerNote: '오늘 다룰 내용입니다.' },
            { type: 'content' as const, heading: '핵심 전략 1', bullets: ['작게 시작하라', '매일 반복하라', '기록하라'], mediaType: 'image' as const, speakerNote: '첫 번째 전략입니다.' },
            { type: 'summary' as const, heading: '핵심 정리', bullets: ['작게 시작하라', '꾸준히 반복하라', '기록으로 성장을 확인하라'], cta: '오늘 바로 시작하세요', mediaType: 'image' as const, speakerNote: '오늘 배운 내용을 정리하겠습니다.' },
          ],
        }}
      />
      <Composition
        id="ChurchAdReel"
        component={ChurchAdReel}
        schema={churchAdSchema}
        durationInFrames={CHURCH_AD_DEFAULT_DURATION}
        fps={REELS_FPS}
        width={CHURCH_AD_WIDTH}
        height={CHURCH_AD_HEIGHT}
        calculateMetadata={({ props }) => ({
          durationInFrames: calculateChurchAdDuration(
            props.slides?.length ?? 8,
            props.audioDurationSec,
            props.sceneDurationsSec
          ),
        })}
        defaultProps={{
          title: '우리교회 안내',
          churchName: '우리교회',
          slogan: '함께 예배하고 함께 살아가는 공동체',
          accentColor: '#d4a657',
          backgroundColor: '#0f1c2e',
          audioDurationSec: 0,
          bgmVolume: 0.1,
          slides: [
            { type: 'cover' as const, heading: '우리교회', subheading: '함께 예배하는 공동체', mediaType: 'image' as const, speakerNote: '우리교회에 오신 것을 환영합니다.' },
            { type: 'welcome' as const, heading: '환영합니다', subheading: '처음 오신 분도 편안하게 예배드릴 수 있어요', mediaType: 'image' as const, speakerNote: '우리는 모두를 환영합니다.' },
            { type: 'worship-times' as const, heading: '예배 시간', services: [{ name: '주일 1부', schedule: '주일 오전 9:00', place: '본당' }, { name: '주일 2부', schedule: '주일 오전 11:00', place: '본당' }], mediaType: 'image' as const, speakerNote: '매주 두 번의 주일 예배가 있습니다.' },
            { type: 'invitation' as const, heading: '당신을 초대합니다', cta: '이번 주일, 함께해요', mediaType: 'image' as const, speakerNote: '이번 주일, 함께 예배드려요.' },
          ],
        }}
      />

      <Composition
        id="LectureThumbnail"
        component={ThumbnailScene}
        schema={thumbnailSchema}
        durationInFrames={1}
        fps={REELS_FPS}
        width={1280}
        height={720}
        defaultProps={{
          title: '강의 제목',
          accentColor: '#4f8ef7',
          mediaType: 'image' as const,
        }}
      />
    </>
  );
};
