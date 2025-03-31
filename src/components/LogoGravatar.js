import md5 from 'md5';

const Gravatar = ({ email, size = 200, className = "h-8 w-8 rounded-full" }) => {
  const getGravatarUrl = (email, size) => {
    const hash = md5(email.trim().toLowerCase());
    return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=retro`;
  };

  const avatarUrl = getGravatarUrl(email || 'nulled', size);

  return <img className={className} src={avatarUrl} alt="User Avatar" />;
};

export default Gravatar;
