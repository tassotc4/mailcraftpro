// Disposable/temporary email domain blocklist
// Covers the most widely-used throwaway email services

const BLOCKED_DOMAINS = new Set([
  // Mailinator family
  'mailinator.com','mailinator.net','mailinator.org','mailinator.us','mailinator2.com',
  'notmailinator.com','tmailinator.com',

  // Guerrilla Mail family
  'guerrillamail.com','guerrillamail.net','guerrillamail.org','guerrillamail.de',
  'guerrillamail.info','guerrillamail.biz','guerrillamailblock.com',
  'guerillamail.com','guerillamail.net','guerillamail.org','guerillamail.de',
  'guerillamail.info','guerillamail.biz',
  'grr.la','sharklasers.com','spam4.me',

  // YOPmail family
  'yopmail.com','yopmail.fr','yopmail.net','yopmail.org','cool.fr.nf',
  'jetable.fr.nf','courriel.fr.nf','moncourrier.fr.nf','monemail.fr.nf',
  'monmail.fr.nf',

  // 10 Minute Mail family
  '10minutemail.com','10minutemail.net','10minutemail.org','10mail.org',
  '20minutemail.com','my10minutemail.com',

  // Temp Mail
  'temp-mail.org','temp-mail.io','temp-mail.de','temp-mail.ru','temp-mail.com',
  'tempmail.eu','tempmail.io','tempmail.de','tempmail.it',
  'tempemail.com','tempemail.net','tempemail.biz','tempinbox.com',
  'temporaryemail.net','temporaryemail.us','tempsky.com','tempthe.net',
  'tempymail.com','temporarioemail.com.br','temporalmail.com',
  'tempalias.com','temp.emeraldwebmail.com',

  // Trash Mail family
  'trashmail.com','trashmail.net','trashmail.org','trashmail.at',
  'trashmail.io','trashmail.me','trashmail.xyz','trashemail.de',
  'trashimail.com','trash-mail.com','trash-mail.de','trash-mail.at',
  'trash-mail.me','trash-mail.io','trash-mail.xyz',

  // Throwaway
  'throwaway.email','throwamail.net','throwam.com',

  // Maildrop / Drop
  'maildrop.cc','mailnesia.com','mailnull.com','dispostable.com',
  'discard.email','discardmail.com','discardmail.de',

  // Fake / Spam boxes
  'fakeinbox.com','fakeinbox.net','fakeinbox.org','fakemail.fr',
  'fakemailz.com','fake-box.com',
  'spambox.us','spamgourmet.com','spamgourmet.net','spamgourmet.org',
  'spamfree24.org','spamfree24.de','spamfree24.eu','spamfree24.net',
  'spamfree24.info','spamex.com','spaml.com','spaml.de',

  // Wegwerf (German throwaway)
  'wegwerfmail.de','wegwerfmail.net','wegwerfmail.org','wegwerfmail.info',
  'wegwerf-email.de','wegwerf-email.at','wegwerf-email.net','wegwerf-email.org',
  'wegwerfadresse.de','weg-werf-email.de',

  // Jetable (French throwaway)
  'jetable.com','jetable.net','jetable.org','mail-temporaire.fr',
  'mailtemporaire.com','mailtemporaire.fr','temporamail.com',

  // MailEater / anti-spam services abused for throwaway
  'antichef.com','antichef.net','mailcatch.com','mailmoat.com',
  'maileimer.de','maildo.de','mail-filter.com',

  // Burner / anonymous mail
  'anonbox.net','anonymail.dk','anonymbox.com','incognitomail.com',
  'incognitomail.net','incognitomail.org','myphantomemail.com',
  'myalias.pw','myspamless.com',

  // Spamgrid / other spam services
  'spamoff.de','spamday.com','spamhog.com','spamhole.com',
  'spamify.com','spaminator.de','spamkill.info','spamam.de',
  'spamail.de','spamspot.com','spamtroll.net',

  // Quick / fast throwaway
  'quickinbox.com','quickmail.nl','quickmail.in',
  'getonemail.com','getonemail.net','getmails.eu',

  // One-use address services
  'oneoffemail.com','onewaymail.com','instantemailaddress.com',
  'instant-mail.de','emailtmp.com','emailtemporary.com',

  // Misc popular disposable services
  'mailnew.com','mailrock.biz','mailscrap.com','mailquack.com',
  'mailbidon.com','mailbiz.biz','mailcat.biz','maildrop.cc',
  'mailimate.com','mailin8r.com','mailinater.com',
  'mailismagic.com','mailme.ir','mailme.lv','mailme24.com',
  'mailmetrash.com','mailpick.biz','mailproxsy.com',
  'mailslapping.com','mailslite.com','mailtechx.com',
  'mailtemp.info','mailtothis.com','mailtrash.net',
  'mailtv.net','mailtv.tv','mailzilla.com','mailzilla.org',
  'meltmail.com','mintemail.com','moakt.com',

  // Cock.li and friends
  'cock.li','airmail.cc','cumallover.me','dicksinhisan.us',
  'getbackinthe.kitchen','myfacewhen.net','penis.computer',
  'tittyfuck.sex','wants.dicksinhisan.us',

  // Popular misc
  'drdrb.com','drdrb.net','dump-email.info','dumpmail.de',
  'dumpyemail.com','e4ward.com','easytrashmail.com',
  'emailinfive.com','emailx.at.hm','emailxfer.com',
  'ephemail.net','eyepaste.com','filzmail.com',
  'flurre.com','flurred.com','flyspam.com','forgetmail.com',
  'fr33mail.info','fudgerub.com','getairmail.com',
  'gishpuppy.com','grandmamail.com','grandmasmail.com',
  'hailmail.net','hatespam.org','hidzz.com','hmamail.com',
  'ieatspam.eu','ieatspam.info','ieh-mail.de',
  'ignoremail.com','imails.info','inbax.tk','inboxbear.com',
  'inoutmail.de','inoutmail.eu','inoutmail.info','inoutmail.net',
  'insorg-mail.info','ipoo.org','junk.to','junkmail.ga',
  'junkmail.gq','jupimail.com','kasmail.com','kaspop.com',
  'killmail.com','killmail.net','klassmaster.com','klzlk.com',
  'koszmail.pl','kurzepost.de','lackmail.net','lackmail.ru',
  'lavache.com','lazyinbox.com','litedrop.com',
  'losemymail.com','lr78.com','m21.cc','mailbucket.org',
  'mailexpire.com','mailfreeonline.com','mailguard.me',
  'mailimitate.com','mailorg.org','mailsoul.com',
  'meinspamschutz.de','messagebeamer.de','mezimages.net',
  'mierdamail.com','milimail.org','mindless.com',
  'mmmmail.com','mobi.web.id','monumentmail.com',
  'mt2009.com','mt2014.com','my-mail.ch',
  'mymail-in.net','mymailoasis.com','mynetstore.de',
  'mysamp.de','mytempemail.com','mytrashmail.com',
  'neverbox.com','nomail.pw','nomail2me.com',
  'nomorespamemails.com','nospam.ze.tc','nospam4.us',
  'nospamfor.us','nospammail.net','nowhere.org',
  'nowmymail.com','nurfuerspam.de','odaymail.com',
  'odnorazovoe.ru','opentrash.com','otherinbox.com',
  'ovpn.to','paplease.com','pjjkp.com','plexolan.de',
  'pop3.xyz','privy-mail.com','privymail.de',
  'proxi.ml','pubmail.io','punkass.com',
  'rcpt.at','recyclemail.dk','rejectmail.com',
  'remainmail.com','rmqkr.net','rppkn.com',
  'safe-mail.net','safetymail.info','safetypost.de',
  'sandelf.de','saynotospams.com','schrott-mail.de',
  'secretemail.de','secure-mail.biz','shieldedmail.com',
  'shitmail.de','shitmail.me','shitmail.org',
  'shortmail.net','skeefmail.com','slopsbox.com',
  'slothmail.net','slushmail.com','snakemail.com',
  'sneakemail.com','sneakmail.de','sofort-mail.de',
  'solar-impact.pro','soodo.com','soisz.com',
  'spambob.com','spambob.net','spambob.org',
  'spambog.com','spambog.de','spambog.ru',
  'spambox.info','spamcannon.com','spamcannon.net',
  'spamcon.org','spamcowboy.com','spamcowboy.net',
  'spamcowboy.org','spamcero.com','spamfighter.cf',
  'spamfighter.ga','spamfighter.gq','spamfighter.ml',
  'spamfighter.tk','spamfree.eu','spamgoes.in',
  'spamgrid.com','speed.1s.fr','spoofmail.de',
  'ssl-mail.com','stop-my-spam.com','stuffmail.de',
  'super-auswahl.de','supergreatmail.com','supermailer.jp',
  'suremail.info','sweetxxx.de','tafmail.com',
  'talkinator.com','tapchicuoihoi.com','techemail.com',
  'techmail.info','tempr.email','thisisnotmyrealemail.com',
  'thismail.net','thismail.ru','tilien.com',
  'toomail.biz','topranklist.de','trash2009.com',
  'trash2010.com','trash2011.com','trashzone.com',
  'trayna.com','trbvm.com','trickmail.net',
  'trillianpro.com','trmailbox.com','ttttt.ml',
  'turual.com','twinmail.de','tyldd.com',
  'upliftnow.com','uplipht.com','uroid.com',
  'valemail.net','venompen.com','veryrealemail.com',
  'viditag.com','viralplays.com','vomoto.com',
  'vubby.com','walala.org','walkmail.net',
  'walkmail.ru','webemail.me','welikecookies.com',
  'wh4f.org','whyspam.me','wickmail.net',
  'willhackforfood.biz','willselfdestruct.com',
  'winemaven.info','wuzupmail.net','wwwnew.eu',
  'x1post.com','xagloo.co','xagloo.com',
  'xemaps.com','xents.com','xmaily.com',
  'xoxy.net','xsmail.com','xyzfree.net',
  'yapped.net','yogamaven.com','yomail.info',
  'youmailr.com','yuurok.com','z0d.eu',
  'zebins.com','zebins.eu','zehnminuten.de',
  'zippymail.info','zoaxe.com','zoemail.net',
  'zoemail.org','zombie-hive.com','zomg.info',

  // Free subdomain abuse (.cf/.ga/.gq/.ml/.tk are used heavily for throwaway)
  // These are caught by the TLD check below instead
]);

// TLDs heavily associated with free throwaway domains (Freenom)
const SUSPICIOUS_TLDS = new Set(['.cf', '.ga', '.gq', '.ml', '.tk']);

// Known legitimate providers that look suspicious but aren't
const ALLOWLIST = new Set([
  'gmail.com', 'googlemail.com', 'yahoo.com', 'yahoo.co.uk', 'yahoo.co.in',
  'yahoo.com.au', 'yahoo.fr', 'yahoo.de', 'yahoo.es', 'yahoo.it',
  'outlook.com', 'outlook.co.uk', 'hotmail.com', 'hotmail.co.uk',
  'hotmail.fr', 'hotmail.de', 'hotmail.es', 'hotmail.it',
  'live.com', 'live.co.uk', 'live.fr', 'live.de', 'live.nl',
  'icloud.com', 'me.com', 'mac.com',
  'protonmail.com', 'protonmail.ch', 'pm.me',
  'zoho.com', 'aol.com', 'mail.com',
  'msn.com', 'passport.com',
  'fastmail.com', 'fastmail.fm',
  'gmx.com', 'gmx.de', 'gmx.net', 'gmx.at', 'gmx.co.uk',
  'web.de', 'freenet.de', 't-online.de', 'gmx.info',
  'rocketmail.com', 'ymail.com',
  'tutanota.com', 'tutanota.de', 'tutamail.com', 'keemail.me',
  'hushmail.com',
]);

/**
 * Returns null if email is valid, or an error string if not.
 */
export function validateEmail(email) {
  if (!email || typeof email !== 'string') return 'Please enter an email address.';

  const trimmed = email.trim().toLowerCase();

  // Basic format check
  const parts = trimmed.split('@');
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    return 'Please enter a valid email address.';
  }

  const [local, domain] = parts;

  // Domain must have at least one dot
  if (!domain.includes('.')) return 'Please enter a valid email address.';

  // Allow-listed domains bypass all other checks
  if (ALLOWLIST.has(domain)) return null;

  // Block known disposable domains
  if (BLOCKED_DOMAINS.has(domain)) {
    return 'Temporary or disposable email addresses are not allowed. Please use your real email address.';
  }

  // Block suspicious Freenom TLDs (unless allowlisted above)
  const tld = '.' + domain.split('.').pop();
  if (SUSPICIOUS_TLDS.has(tld)) {
    return 'Temporary or disposable email addresses are not allowed. Please use your real email address.';
  }

  // Block subdomains of known blocklisted domains
  // e.g. anything.mailinator.com
  for (const blocked of BLOCKED_DOMAINS) {
    if (domain.endsWith('.' + blocked)) {
      return 'Temporary or disposable email addresses are not allowed. Please use your real email address.';
    }
  }

  return null;
}
