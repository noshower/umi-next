import { copyFileSync, existsSync } from 'fs';
import { join } from 'path';
import { IApi } from '../../types';

const FAVICON_FILES = [
  'favicon.ico',
  'favicon.gif',
  'favicon.png',
  'favicon.jpg',
  'favicon.jpeg',
  'favicon.svg',
  'favicon.avif',
  'favicon.webp',
];

function getFaviconFile(p: string): string | undefined {
  const iconlist: any = [];
  FAVICON_FILES.forEach((f) => {
    if (existsSync(join(p, f))) {
      iconlist.push(f);
    }
  });
  return iconlist;
}

export default (api: IApi) => {
  api.describe({
    config: {
      schema: (Joi) => Joi.string(),
    },
  });

  api.modifyAppData(async (memo) => {
    if (api.config.favicon) return memo;
    const faviconFile = getFaviconFile(api.paths.absSrcPath);
    if (faviconFile) {
      memo.faviconFile = faviconFile;
    }
    return memo;
  });

  api.addBeforeMiddlewares(() => [
    (req, res, next) => {
      if (api.appData.faviconFile) {
        var send = false;
        for (const item of api.appData.faviconFile) {
          if (req.path === `/${item}`) {
            send = true;
            res.sendFile(join(api.paths.absSrcPath, item));
          }
        }
        if (!send) {
          next();
        }
      } else {
        next();
      }
    },
  ]);

  api.onBuildComplete(({ err }) => {
    if (err) return;
    if (api.appData.faviconFile) {
      copyFileSync(
        join(api.paths.absSrcPath, api.appData.faviconFile),
        join(api.paths.absOutputPath, api.appData.faviconFile),
      );
    }
  });

  api.modifyHTMLFavicon((memo) => {
    if (api.appData.faviconFile) {
      if (api.appData.faviconFile instanceof Array) {
        const ans: String[] = [];
        api.appData.faviconFile.forEach((e) => {
          ans.push(`${api.config.publicPath}${e}`);
        });
        return ans;
      }
    } else {
      return memo;
    }
  });
};
