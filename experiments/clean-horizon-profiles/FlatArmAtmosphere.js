import {ArmAtmosphere} from './ArmAtmosphere.js';
import {flatColumnShader} from './flat-profile-columns.mjs';

/** Contained flat rendering of the same frozen height/phase model, with exact piecewise-linear columns. */
export class FlatArmAtmosphere extends ArmAtmosphere {
 _runtimeMediumBlock(){return super._runtimeMediumBlock()+'\n'+flatColumnShader(this.profile);}
 _cacheMediumBlock(usesAltitudeScalar=false){return super._cacheMediumBlock(usesAltitudeScalar)+'\n'+flatColumnShader(this.profile);}
}
