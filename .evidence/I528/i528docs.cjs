// I528 / ST-494 (E71 open) - 6-file bookkeeping, byte-exact latin1 round-trip, single-anchor asserts, BOM-preserved.
// Docs-only, zero src. Content was staged in tmp_*.txt (ASCII, no BOM) then normalized here to LF.
const fs=require('fs');
function read(f){return fs.readFileSync(f,'latin1');}
function write(f,s){fs.writeFileSync(f,s,'latin1');}
function bom(s){let c=0;for(let i=0;i<s.length-2;i++)if(s.charCodeAt(i)===0xef&&s.charCodeAt(i+1)===0xbb&&s.charCodeAt(i+2)===0xbf)c++;return c;}
function norm(f){let s=read(f);s=s.replace(/\r\n/g,'\n').replace(/\r/g,'\n');s=s.replace(/\n+$/,'');return s;}
function count(hay,needle){let c=0,i=0;while((i=hay.indexOf(needle,i))>=0){c++;i+=needle.length;}return c;}
function assert1(hay,needle,label){const n=count(hay,needle);if(n!==1){throw new Error(label+': expected 1 occurrence, got '+n+' of '+JSON.stringify(needle.slice(0,60)));}}
// E71 epics block / STATUS(I528) / iterations I528 section / timeline I528 line / changelog I528 line / active I528 note
// were staged as: tmp_e71_block.txt tmp_stories_line.txt tmp_iter_block.txt tmp_timeline_line.txt tmp_changelog_line.txt tmp_active_note.txt
const e71block=norm('tmp_e71_block.txt'),storiesLine=norm('tmp_stories_line.txt'),iterBlock=norm('tmp_iter_block.txt'),tlLine=norm('tmp_timeline_line.txt'),clLine=norm('tmp_changelog_line.txt'),activeNote=norm('tmp_active_note.txt');
const results=[];
// 1 epics.md: E70 header IN PROGRESS->CLOSED (opened I523, closed I527) + append E71 block at EOF (no trailing NL)
{let s=read('production/epics.md');const b0=bom(s);assert1(s,'IN PROGRESS (opened I523)','epics-hdr');s=s.replace('IN PROGRESS (opened I523)','CLOSED (opened I523, closed I527)');s=s+'\n'+e71block;if(bom(s)!==b0)throw new Error('epics BOM changed');write('production/epics.md',s);results.push('epics.md');}
// 2 stories.md: insert STATUS (I528) line before STATUS (I527): (CRLF)
{let s=read('production/stories.md');const b0=bom(s);assert1(s,'STATUS (I527):','stories');s=s.replace('STATUS (I527):',storiesLine+'\r\nSTATUS (I527):');if(bom(s)!==b0)throw new Error('stories BOM changed');write('production/stories.md',s);results.push('stories.md');}
// 3 iterations.md: append I528 section at EOF (LF, blank-line separated)
{let s=read('production/iterations.md');const b0=bom(s);s=s+'\n'+iterBlock+'\n';if(bom(s)!==b0)throw new Error('iterations BOM changed');write('production/iterations.md',s);results.push('iterations.md');}
// 4 timeline.md: append I528 line at EOF (LF)
{let s=read('production/timeline.md');const b0=bom(s);s=s+tlLine+'\n';if(bom(s)!==b0)throw new Error('timeline BOM changed');write('production/timeline.md',s);results.push('timeline.md');}
// 5 CHANGELOG.md: insert I528 line after "## [Unreleased]\r\n" (CRLF)
{let s=read('CHANGELOG.md');const b0=bom(s);assert1(s,'## [Unreleased]\r\n','changelog');s=s.replace('## [Unreleased]\r\n','## [Unreleased]\r\n'+clLine+'\r\n');if(bom(s)!==b0)throw new Error('changelog BOM changed');write('CHANGELOG.md',s);results.push('CHANGELOG.md');}
// 6 active.md: finalize the one I527 push-pending line -> PUSHED-OK 093b7c3..bf6df5f + append I528 note (LF)
{let s=read('production/session-state/active.md');const b0=bom(s);assert1(s,'Committed (this story) + push pending.','active-finalize');s=s.replace('Committed (this story) + push pending.','Committed bf6df5f + PUSHED-OK (093b7c3..bf6df5f).');s=s+activeNote+'\n';if(bom(s)!==b0)throw new Error('active BOM changed');write('production/session-state/active.md',s);results.push('active.md');}
console.log('APPLIED: '+results.join(' | '));console.log('BOOKKEEP-DONE');