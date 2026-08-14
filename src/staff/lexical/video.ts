/**
 * Video, by where it comes from.
 *
 * One file rather than a parser in the editor and a renderer on the site,
 * because those two have to agree exactly: the editor decides what may be
 * pasted and the site decides what that turns into, and a provider added to
 * one and not the other is either an address the panel rejects for no reason
 * or a stored node that renders as an empty box.
 *
 * WHAT IS STORED IS AN ID, NOT AN ADDRESS — with one exception. Keeping the
 * provider explicit and the id narrow means the renderer never guesses from
 * the shape of a URL, and an edit to the JSON cannot turn an embed into a
 * frame pointing at somewhere else. Facebook is the exception and says why
 * below.
 *
 * EVERY ID IS VALIDATED AGAIN AT RENDER TIME. `readVideoUrl` runs in the
 * panel, which is a courtesy to whoever is pasting; `videoEmbed` runs against
 * whatever is in the database, which is the thing that actually reaches a
 * reader's browser. A value that has been through a migration, a hand-edited
 * column or an older version of this file is not to be trusted into an
 * `iframe` src on the strength of having been checked once.
 */

export type VideoProvider =
  | "youtube"
  | "vimeo"
  | "file"
  | "instagram"
  | "facebook"
  | "tiktok"
  | "linkedin";

/** What the panel calls each one. */
export const VIDEO_LABELS: Record<VideoProvider, string> = {
  youtube: "YouTube",
  vimeo: "Vimeo",
  file: "Video file",
  instagram: "Instagram",
  facebook: "Facebook",
  tiktok: "TikTok",
  linkedin: "LinkedIn",
};

/**
 * Read a pasted address and work out what it points at.
 *
 * Handles what people actually paste — a watch URL, a short link, an embed
 * URL, a post, a reel, a direct link to a file. Anything else returns null and
 * the dialog says so, rather than inserting a block that renders as an empty
 * frame on the live site.
 */
export function readVideoUrl(
  raw: string,
): { provider: VideoProvider; videoId: string } | null {
  const url = raw.trim();
  if (!url) return null;

  const youtube = url.match(
    /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/,
  );
  if (youtube) return { provider: "youtube", videoId: youtube[1] };

  const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeo) return { provider: "vimeo", videoId: vimeo[1] };

  /**
   * Instagram: a post, a reel or an IGTV item.
   *
   * The kind is kept along with the code — `reel/Cxyz` rather than `Cxyz` —
   * because Instagram's embed path includes it. They are largely
   * interchangeable in practice, but building `/p/` for something the author
   * pasted as `/reel/` means relying on a redirect that Instagram is under no
   * obligation to keep.
   */
  const instagram = url.match(
    /instagram\.com\/(?:[\w.]+\/)?(p|reel|reels|tv)\/([\w-]+)/,
  );
  if (instagram) {
    const kind = instagram[1] === "reels" ? "reel" : instagram[1];
    return { provider: "instagram", videoId: `${kind}/${instagram[2]}` };
  }

  /**
   * Facebook keeps the whole address, and it is the one that has to.
   *
   * Facebook's video plugin takes the post's URL as a parameter rather than an
   * id, and there is no single id to extract anyway: a video lives at
   * `/{page}/videos/{id}`, at `/watch/?v={id}`, at `/reel/{id}` and behind an
   * `fb.watch` short link, and only Facebook can say which of those is the
   * same video. So the address is stored — and `videoEmbed` re-checks it is
   * still a Facebook address before it goes anywhere near a frame.
   */
  if (isFacebookUrl(url)) return { provider: "facebook", videoId: url };

  const tiktok = url.match(/tiktok\.com\/(?:@[\w.-]+\/video\/|embed\/v2\/|v\/)(\d+)/);
  if (tiktok) return { provider: "tiktok", videoId: tiktok[1] };

  /**
   * LinkedIn, from either shape of link.
   *
   * A shared post is `/posts/{slug}-activity-{id}-{hash}` and a feed permalink
   * is `/feed/update/urn:li:activity:{id}`. Both carry the same activity id,
   * which is what their embed endpoint wants.
   *
   * `ugcPost` and `share` URNs turn up too, on older posts, and the embed
   * takes those verbatim — so the URN type is kept rather than assumed.
   */
  const linkedinUrn = url.match(/urn:li:(activity|ugcPost|share):(\d+)/);
  if (linkedinUrn) {
    return { provider: "linkedin", videoId: `${linkedinUrn[1]}:${linkedinUrn[2]}` };
  }
  const linkedinPost = url.match(/linkedin\.com\/posts\/[\w%.-]*?activity-(\d+)/);
  if (linkedinPost) return { provider: "linkedin", videoId: `activity:${linkedinPost[1]}` };

  // A file, either in the library or anywhere else that serves one.
  if (/^(https?:\/\/|\/)[^\s]+\.(mp4|webm|mov|m4v)(\?.*)?$/i.test(url)) {
    return { provider: "file", videoId: url };
  }

  return null;
}

/** Facebook's several video shapes, and the short link. */
function isFacebookUrl(url: string): boolean {
  return (
    /^https?:\/\/(?:www\.|web\.|m\.|business\.)?facebook\.com\/[^\s]+/i.test(url) ||
    /^https?:\/\/fb\.watch\/[\w-]+/i.test(url)
  );
}

/**
 * The frame an embed goes in.
 *
 * `aspect` is a Tailwind class, and it is per provider because these are not
 * all landscape videos. A reel is 9:16; forcing one into 16:9 letterboxes it
 * into a strip with two black margins wider than the video. `width` caps the
 * portrait formats, which would otherwise be as tall as the article is wide.
 */
type Frame = { src: string; aspect: string; width?: string };

export function videoEmbed(provider: string, videoId: string): Frame | null {
  switch (provider) {
    case "youtube":
      // The no-cookie host, so an article about a school does not set
      // advertising cookies on whoever came to read it.
      if (!/^[\w-]{11}$/.test(videoId)) return null;
      return {
        src: `https://www.youtube-nocookie.com/embed/${videoId}`,
        aspect: "aspect-video",
      };

    case "vimeo":
      // `dnt=1` is Vimeo's do-not-track, for the same reason.
      if (!/^\d+$/.test(videoId)) return null;
      return {
        src: `https://player.vimeo.com/video/${videoId}?dnt=1`,
        aspect: "aspect-video",
      };

    case "instagram": {
      if (!/^(p|reel|tv)\/[\w-]+$/.test(videoId)) return null;
      return {
        src: `https://www.instagram.com/${videoId}/embed`,
        // Instagram's embed is the picture plus its own header and caption, so
        // it is taller than the media alone. It scrolls inside the frame, so
        // being a little short costs a scroll rather than the video.
        aspect: "aspect-[4/5]",
        width: "max-w-[540px]",
      };
    }

    case "facebook": {
      if (!isFacebookUrl(videoId)) return null;
      return {
        src: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(
          videoId,
        )}&show_text=false`,
        aspect: "aspect-video",
      };
    }

    case "tiktok":
      if (!/^\d+$/.test(videoId)) return null;
      return {
        src: `https://www.tiktok.com/embed/v2/${videoId}`,
        aspect: "aspect-[9/16]",
        width: "max-w-[340px]",
      };

    case "linkedin": {
      const match = videoId.match(/^(activity|ugcPost|share):(\d+)$/);
      if (!match) return null;
      return {
        src: `https://www.linkedin.com/embed/feed/update/urn:li:${match[1]}:${match[2]}`,
        aspect: "aspect-[4/5]",
        width: "max-w-[560px]",
      };
    }

    default:
      return null;
  }
}
